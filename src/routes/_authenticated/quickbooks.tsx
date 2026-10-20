import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, Users, Package, FileCheck, FileText, ShoppingCart, Download, CheckCircle2, XCircle, Plug } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/quickbooks")({
  component: QuickBooksPage,
});

function QuickBooksPage() {
  const [connected, setConnected] = useState(true);

  const syncs = [
    { label: "Sincronizar clientes", icon: Users },
    { label: "Sincronizar produtos", icon: Package },
    { label: "Criar Estimate", icon: FileCheck },
    { label: "Criar Invoice", icon: FileText },
    { label: "Criar Purchase Order", icon: ShoppingCart },
    { label: "Importar pagamentos", icon: Download },
  ];

  const logs = [
    { time: "24/06 09:12", msg: "Invoice INV-2026-0001 sincronizada", ok: true },
    { time: "24/06 09:10", msg: "5 clientes sincronizados", ok: true },
    { time: "23/06 17:40", msg: "Falha ao criar Estimate EST-2026-0003: token expirado", ok: false },
    { time: "23/06 11:05", msg: "10 produtos sincronizados", ok: true },
  ];

  return (
    <div>
      <PageHeader
        icon={RefreshCw}
        title="QuickBooks"
        subtitle="Sistema financeiro oficial nesta versão — integração via API"
      />

      <div className="mb-5 flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={"flex h-11 w-11 items-center justify-center rounded-xl " + (connected ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
            <Plug className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display font-semibold text-foreground">Status da conexão</p>
            <p className="text-sm text-muted-foreground">{connected ? "Conectado · Amazon Jet Aviation LLC" : "Desconectado"}</p>
          </div>
        </div>
        <Button variant={connected ? "outline" : "default"} onClick={() => { setConnected(!connected); toast.success(connected ? "Desconectado" : "Conectado ao QuickBooks (simulado)"); }}>
          {connected ? "Desconectar" : "Conectar QuickBooks"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {syncs.map((s) => (
          <button
            key={s.label}
            onClick={() => toast.success(`${s.label} — concluído (simulado)`)}
            className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-soft transition-all hover:shadow-card"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><s.icon className="h-4 w-4" /></span>
            <span className="text-sm font-medium text-foreground">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl border bg-card shadow-card">
        <div className="border-b px-4 py-3"><h3 className="font-display text-sm font-semibold">Logs de integração</h3></div>
        <ul className="divide-y">
          {logs.map((l, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3 text-sm">
              {l.ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-aog" />}
              <span className="text-foreground">{l.msg}</span>
              <span className="ml-auto text-xs text-muted-foreground">{l.time}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        Nesta primeira versão, o QuickBooks é o sistema financeiro oficial. O módulo Financeiro interno já está
        estruturado para substituí-lo no futuro.
      </p>
    </div>
  );
}
