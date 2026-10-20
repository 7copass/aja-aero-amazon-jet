import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, FileDown, CalendarDays, CalendarRange, Calendar, Users, Percent, Award, Package, Clock, XCircle, Siren } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useRows } from "@/lib/db";
import { money } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/relatorios")({
  component: RelatoriosPage,
});

const reports = [
  { label: "Relatório diário", icon: CalendarDays },
  { label: "Relatório semanal", icon: CalendarRange },
  { label: "Relatório mensal", icon: Calendar },
  { label: "Vendas por cliente", icon: Users },
  { label: "Margem por cotação", icon: Percent },
  { label: "Fornecedores melhor performance", icon: Award },
  { label: "Peças mais cotadas", icon: Package },
  { label: "Tempo médio de resposta", icon: Clock },
  { label: "Cotações perdidas e motivo", icon: XCircle },
  { label: "AOGs atendidos", icon: Siren },
];

function RelatoriosPage() {
  const { data: quotes = [] } = useRows<any>("quotes");
  const { data: customers = [] } = useRows<any>("customers");
  const { data: invoices = [] } = useRows<any>("invoices");

  const salesByCustomer = customers.map((c) => ({
    nome: c.name.split(" ")[0],
    total: invoices.filter((i) => i.customer_id === c.id).reduce((s, i) => s + Number(i.total ?? 0), 0),
  })).filter((d) => d.total > 0);

  const aogCount = quotes.filter((q) => q.is_aog).length;

  return (
    <div>
      <PageHeader icon={BarChart3} title="Relatórios" subtitle="Indicadores operacionais e comerciais" />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {reports.map((r) => (
          <button
            key={r.label}
            onClick={() => toast.success(`${r.label} gerado (PDF)`)}
            className="flex flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left shadow-soft transition-all hover:shadow-card"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-gold-foreground"><r.icon className="h-4 w-4" /></span>
            <span className="text-xs font-medium leading-snug text-foreground">{r.label}</span>
            <span className="mt-auto flex items-center gap-1 text-[11px] text-muted-foreground"><FileDown className="h-3 w-3" /> Exportar</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <h3 className="mb-3 font-display text-sm font-semibold">Vendas por cliente</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesByCustomer}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="nome" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => money(Number(v))} />
              <Bar dataKey="total" fill="#2d3a5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <h3 className="mb-3 font-display text-sm font-semibold">Resumo do período</h3>
          <ul className="space-y-3 text-sm">
            <Row label="Cotações totais" value={quotes.length} />
            <Row label="Cotações AOG" value={aogCount} />
            <Row label="Aprovadas" value={quotes.filter((q) => q.status === "aprovado").length} />
            <Row label="Perdidas" value={quotes.filter((q) => q.status === "perdido").length} />
            <Row label="Faturamento" value={money(invoices.reduce((s, i) => s + Number(i.total ?? 0), 0))} />
            <Row label="Margem média" value={`${(quotes.reduce((s, q) => s + Number(q.real_margin ?? 0), 0) / (quotes.length || 1)).toFixed(1)}%`} />
          </ul>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <li className="flex items-center justify-between border-b pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </li>
  );
}
