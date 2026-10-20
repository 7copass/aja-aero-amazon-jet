import { createFileRoute } from "@tanstack/react-router";
import {
  FileText, AlertTriangle, Send, CheckCircle2, ShoppingCart, Plane, Award,
  DollarSign, TrendingUp, Users, Truck,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Area, AreaChart,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useRows } from "@/lib/db";
import { money } from "@/lib/format";
import { quoteStatus } from "@/lib/status";
import { useTr } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

// Softer, more modern chart palette
const CHART = ["#42598a", "#cdb168", "#6a93c0", "#5fb389", "#d07b6e"];

const AOG_ALERT: Record<string, (n: number) => string> = {
  pt: (n) => `${n} cotação(ões) AOG ativa(s) exigem atenção imediata.`,
  en: (n) => `${n} active AOG quote(s) require immediate attention.`,
  es: (n) => `${n} cotización(es) AOG activa(s) requieren atención inmediata.`,
};

function DashboardPage() {
  const { tr, lang } = useTr();
  const { data: quotes = [] } = useRows<any>("quotes");
  const { data: estimates = [] } = useRows<any>("estimates");
  const { data: pos = [] } = useRows<any>("purchase_orders");
  const { data: logistics = [] } = useRows<any>("logistics");
  const { data: certs = [] } = useRows<any>("certificates");
  const { data: invoices = [] } = useRows<any>("invoices");
  const { data: customers = [] } = useRows<any>("customers");
  const { data: suppliers = [] } = useRows<any>("suppliers");

  const openQuotes = quotes.filter((q) => !["aprovado", "perdido", "cancelado"].includes(q.status));
  const aogQuotes = quotes.filter((q) => q.is_aog && !["aprovado", "perdido", "cancelado"].includes(q.status));
  const sentEstimates = estimates.filter((e) => e.status !== "rascunho");
  const approvedSales = quotes.filter((q) => q.status === "aprovado");
  const pendingPurchases = pos.filter((p) => !["liberado_logistica"].includes(p.status));
  const inTransit = logistics.filter((l) => !["entregue"].includes(l.status));
  const pendingCerts = certs.filter((c) => c.status !== "aprovado");

  const monthSales = invoices
    .filter((i) => i.status !== "cancelado")
    .reduce((s, i) => s + Number(i.total ?? 0), 0);
  const avgMargin = quotes.length
    ? quotes.reduce((s, q) => s + Number(q.real_margin ?? 0), 0) / quotes.length
    : 0;

  // Charts
  const byStatus = Object.entries(quoteStatus).map(([k, v]) => ({
    name: tr(v.label),
    value: quotes.filter((q) => q.status === k).length,
  })).filter((d) => d.value > 0);

  const salesByMonth = [
    { mes: "Fev", vendas: 18200 }, { mes: "Mar", vendas: 24500 }, { mes: "Abr", vendas: 31000 },
    { mes: "Mai", vendas: 27800 }, { mes: "Jun", vendas: monthSales || 29500 },
  ];

  const marginByOp = quotes.slice(0, 6).map((q) => ({
    nome: q.internal_number?.replace("COT-2026-", "#") ?? "—",
    margem: Number(q.real_margin ?? 0),
  }));

  const topSuppliers = [
    { nome: "Southern Cross", uso: 8 }, { nome: "Aviation Parts", uso: 6 },
    { nome: "Aircraft Spruce", uso: 5 }, { nome: "Textron", uso: 4 }, { nome: "VSE", uso: 3 },
  ];

  return (
    <div>
      <PageHeader
        icon={FileText}
        title="Dashboard"
        subtitle="Visão geral operacional · Amazon Jet Aviation"
      />

      {aogQuotes.length > 0 && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-aog/25 bg-aog/[0.07] px-4 py-3 text-sm font-medium text-aog">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {(AOG_ALERT[lang] ?? AOG_ALERT.pt)(aogQuotes.length)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard label="Cotações abertas" value={openQuotes.length} icon={FileText} tone="navy" />
        <StatCard label="Cotações AOG" value={aogQuotes.length} icon={AlertTriangle} tone="aog" />
        <StatCard label="Estimates enviados" value={sentEstimates.length} icon={Send} tone="gold" />
        <StatCard label="Vendas aprovadas" value={approvedSales.length} icon={CheckCircle2} tone="success" />
        <StatCard label="Compras pendentes" value={pendingPurchases.length} icon={ShoppingCart} tone="warning" />
        <StatCard label="Pedidos em trânsito" value={inTransit.length} icon={Plane} tone="navy" />
        <StatCard label="Certificados pendentes" value={pendingCerts.length} icon={Award} tone="warning" />
        <StatCard label="Valor vendido (mês)" value={money(monthSales)} icon={DollarSign} tone="success" />
        <StatCard label="Margem bruta (mês)" value={`${avgMargin.toFixed(1)}%`} icon={TrendingUp} tone="gold" />
        <StatCard label="Clientes ativos" value={customers.length} icon={Users} tone="navy" />
        <StatCard label="Fornecedores ativos" value={suppliers.length} icon={Truck} tone="navy" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Cotações por status">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={92} paddingAngle={3} stroke="none">
                {byStatus.map((_, i) => <Cell key={i} fill={CHART[i % CHART.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Vendas por mês">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={salesByMonth}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#cdb168" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#cdb168" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.12} vertical={false} />
              <XAxis dataKey="mes" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => money(Number(v))} />
              <Area type="monotone" dataKey="vendas" stroke="#bfa14a" strokeWidth={2.5} fill="url(#salesGrad)" dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Margem por operação">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={marginByOp}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.12} vertical={false} />
              <XAxis dataKey="nome" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${v}%`} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="margem" fill="#42598a" radius={[6, 6, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fornecedores mais utilizados">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topSuppliers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.12} horizontal={false} />
              <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="nome" fontSize={12} width={100} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="uso" fill="#cdb168" radius={[0, 6, 6, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="PNs mais cotados">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={[
              { pn: "3G2370A03351", q: 4 }, { pn: "9910312-1", q: 3 }, { pn: "CV3-2000", q: 3 },
              { pn: "GTN-750", q: 2 }, { pn: "622-9352-001", q: 2 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.12} vertical={false} />
              <XAxis dataKey="pn" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="q" fill="#6a93c0" radius={[6, 6, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tempo médio de resposta (horas)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={[
              { mes: "Fev", h: 9.2 }, { mes: "Mar", h: 7.8 }, { mes: "Abr", h: 6.5 },
              { mes: "Mai", h: 5.9 }, { mes: "Jun", h: 4.7 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.12} vertical={false} />
              <XAxis dataKey="mes" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${v}h`} />
              <Legend />
              <Line type="monotone" dataKey="h" name="Horas" stroke="#5fb389" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: "0.75rem",
  border: "1px solid var(--border)",
  background: "var(--card)",
  boxShadow: "var(--shadow-card)",
  fontSize: "12px",
} as const;

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  const { tr } = useTr();
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft transition-shadow hover:shadow-card">
      <h3 className="mb-4 font-display text-sm font-semibold text-foreground">{tr(title)}</h3>
      {children}
    </div>
  );
}
