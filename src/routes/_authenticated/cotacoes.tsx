import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  FileText, Plus, AlertTriangle, Calculator, Send, FileCheck, RefreshCw,
  FileDown, MessageCircle, Clock, CheckCircle2, XCircle, Archive,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRows, useSaveRow, useArchiveRow, logActivity, nextDocumentNumber } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { quoteStatus, quoteColumns } from "@/lib/status";
import { money, fmtDate, hoursSince } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTr } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/cotacoes")({
  component: CotacoesPage,
});

function CotacoesPage() {
  const { tr } = useTr();
  const { data: quotes = [], isLoading } = useRows<any>("quotes");
  const { data: customers = [] } = useRows<any>("customers");
  const save = useSaveRow("quotes");
  const archive = useArchiveRow("quotes");
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [prefill, setPrefill] = useState<any>(null);

  const openNew = async () => {
    const n = await nextDocumentNumber("quote");
    setEditing(null);
    setPrefill(n ? { internal_number: n } : null);
    setOpen(true);
  };
  const [detail, setDetail] = useState<any>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const custName = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";

  const fields: Field[] = [
    { name: "internal_number", label: "Número interno", required: true, placeholder: "COT-2026-00XX" },
    { name: "customer_id", label: "Cliente", type: "select", options: customers.map((c) => ({ value: c.id, label: c.name })) },
    { name: "responsible", label: "Responsável" },
    { name: "quote_date", label: "Data", type: "date" },
    { name: "valid_until", label: "Validade", type: "date" },
    { name: "is_aog", label: "AOG", type: "switch" },
    { name: "aircraft", label: "Aeronave" },
    { name: "suppliers_consulted", label: "Fornecedores consultados" },
    { name: "supplier_cost", label: "Custo fornecedor (USD)", type: "number" },
    { name: "freight", label: "Frete (USD)", type: "number" },
    { name: "import_fee", label: "Taxa import./logística (USD)", type: "number" },
    { name: "exchange_rate", label: "Câmbio", type: "number" },
    { name: "desired_margin", label: "Margem desejada (%)", type: "number" },
    { name: "final_price", label: "Preço final (USD)", type: "number" },
    { name: "status", label: "Status", type: "select", options: quoteColumns.map((s) => ({ value: s, label: quoteStatus[s].label })) },
    { name: "notes", label: "Observações", type: "textarea" },
  ];

  const setStatus = async (id: string, status: string) => {
    await supabase.from("quotes").update({ status: status as any }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["quotes"] });
    logActivity("quotes", `cotação -> ${quoteStatus[status]?.label ?? status}`);
    setDetail(null);
  };

  const handleDrop = async (col: string) => {
    const id = draggedId;
    setDraggedId(null);
    setDragOverCol(null);
    if (!id) return;
    const quote = quotes.find((q) => q.id === id);
    if (!quote || quote.status === col) return;
    // optimistic update
    qc.setQueryData(["quotes"], (old: any) =>
      Array.isArray(old) ? old.map((q) => (q.id === id ? { ...q, status: col } : q)) : old,
    );
    await supabase.from("quotes").update({ status: col as any }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["quotes"] });
    logActivity("quotes", `cotação -> ${quoteStatus[col]?.label ?? col}`, quote.internal_number);
    toast.success(`${quote.internal_number} → ${tr(quoteStatus[col]?.label ?? col)}`);
  };

  return (
    <div>
      <PageHeader
        icon={FileText}
        title="Cotações"
        subtitle="Pipeline comercial — do AOG ao fechamento"
        actions={<Button onClick={openNew}><Plus className="mr-1.5 h-4 w-4" /> {tr("Nova cotação")}</Button>}
      />

      <Tabs defaultValue="kanban">
        <TabsList className="mb-4">
          <TabsTrigger value="kanban">{tr("Kanban")}</TabsTrigger>
          <TabsTrigger value="tabela">{tr("Tabela")}</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {quoteColumns.map((col) => {
              const items = quotes.filter((q) => q.status === col);
              const isOver = dragOverCol === col;
              return (
                <div
                  key={col}
                  className="flex w-72 shrink-0 flex-col"
                  onDragOver={(e) => { e.preventDefault(); if (dragOverCol !== col) setDragOverCol(col); }}
                  onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol((c) => (c === col ? null : c)); }}
                  onDrop={() => handleDrop(col)}
                >
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tr(quoteStatus[col].label)}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{items.length}</span>
                  </div>
                  <div
                    className={cn(
                      "min-h-24 space-y-2 rounded-xl p-1 transition-colors",
                      isOver && "bg-primary/5 ring-2 ring-primary/30 ring-inset",
                    )}
                  >
                    {items.map((q) => {
                      const stale = !["aprovado", "perdido", "cancelado"].includes(q.status) && hoursSince(q.last_followup) > 24;
                      return (
                        <div
                          key={q.id}
                          draggable
                          onDragStart={() => setDraggedId(q.id)}
                          onDragEnd={() => { setDraggedId(null); setDragOverCol(null); }}
                          onClick={() => setDetail(q)}
                          className={cn(
                            "w-full cursor-grab rounded-xl border bg-card p-3 text-left shadow-soft transition-all hover:shadow-card active:cursor-grabbing",
                            q.is_aog && "border-aog/40 ring-1 ring-aog/20",
                            draggedId === q.id && "rotate-1 opacity-50",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-semibold text-foreground">{q.internal_number}</span>
                            {q.is_aog && <StatusBadge label="AOG" tone="aog" />}
                          </div>
                          <p className="mt-1 text-sm font-medium text-foreground">{custName(q.customer_id)}</p>
                          <p className="text-xs text-muted-foreground">{q.aircraft ?? "—"}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">{money(q.final_price)}</span>
                            <span className="text-xs text-muted-foreground">{Number(q.real_margin ?? 0).toFixed(0)}%</span>
                          </div>
                          {stale && (
                            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-warning-foreground">
                              <Clock className="h-3 w-3" /> Follow-up &gt; 24h
                            </p>
                          )}
                        </div>
                      );
                    })}
                    {items.length === 0 && <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">{tr("Vazio")}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="tabela">
          <DataTable
            rows={quotes}
            loading={isLoading}
            searchKeys={["internal_number", "aircraft"]}
            onRowClick={(r) => setDetail(r)}
            columns={[
              { key: "internal_number", header: tr("Número"), render: (r) => (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold">{r.internal_number}</span>
                  {r.is_aog && <StatusBadge label="AOG" tone="aog" />}
                </div>
              ) },
              { key: "customer", header: tr("Cliente"), render: (r) => custName(r.customer_id) },
              { key: "aircraft", header: tr("Aeronave") },
              { key: "final_price", header: tr("Preço final"), render: (r) => <span className="font-medium">{money(r.final_price)}</span> },
              { key: "real_margin", header: tr("Margem"), render: (r) => <span>{Number(r.real_margin ?? 0).toFixed(1)}%</span> },
              { key: "status", header: tr("Status"), render: (r) => <StatusBadge label={quoteStatus[r.status]?.label ?? r.status} tone={quoteStatus[r.status]?.tone ?? "muted"} /> },
              { key: "actions", header: "", render: (r) => (
                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => archive.mutate(r.id)}><Archive className="h-4 w-4" /></Button>
                </div>
              ), className: "text-right" },
            ]}
          />
        </TabsContent>
      </Tabs>

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar cotação" : "Nova cotação"}
        fields={fields}
        initial={editing ?? prefill}
        saving={save.isPending}
        onSave={(v) => save.mutate(v, { onSuccess: () => setOpen(false) })}
      />

      {detail && (
        <QuoteDetail
          quote={detail}
          customerName={custName(detail.customer_id)}
          onClose={() => setDetail(null)}
          onEdit={() => { setEditing(detail); setPrefill(null); setDetail(null); setOpen(true); }}
          onStatus={setStatus}
          onSaved={() => qc.invalidateQueries({ queryKey: ["quotes"] })}
        />
      )}
    </div>
  );
}

function QuoteDetail({ quote, customerName, onClose, onEdit, onStatus, onSaved }: any) {
  const { tr } = useTr();
  const minMargin = 20;
  const lowMargin = Number(quote.real_margin ?? 0) < minMargin;

  const calc = async () => {
    const cost = Number(quote.supplier_cost ?? 0) + Number(quote.freight ?? 0) + Number(quote.import_fee ?? 0);
    const margin = Number(quote.desired_margin ?? 25);
    const finalPrice = margin < 100 ? cost / (1 - margin / 100) : cost;
    const realMargin = finalPrice > 0 ? ((finalPrice - cost) / finalPrice) * 100 : 0;
    await supabase.from("quotes").update({ final_price: Math.round(finalPrice), real_margin: Number(realMargin.toFixed(1)) }).eq("id", quote.id);
    onSaved();
    logActivity("quotes", "calculou preço", quote.internal_number);
    toast.success(`${tr("Calcular preço")}: ${money(Math.round(finalPrice))} (${realMargin.toFixed(1)}%)`);
    onClose();
  };

  const followup = async () => {
    await supabase.from("quotes").update({ last_followup: new Date().toISOString() }).eq("id", quote.id);
    onSaved();
    logActivity("quotes", "registrou follow-up", quote.internal_number);
    toast.success(tr("Criar follow-up"));
    onClose();
  };

  const actions: { label: string; icon: any; fn: () => void }[] = [
    { label: "Gerar RFQ", icon: Send, fn: () => toast.success("RFQ") },
    { label: "Calcular preço", icon: Calculator, fn: calc },
    { label: "Gerar Estimate", icon: FileCheck, fn: () => toast.success("Estimate") },
    { label: "Enviar p/ QuickBooks", icon: RefreshCw, fn: () => toast.info("QuickBooks") },
    { label: "Gerar PDF", icon: FileDown, fn: () => toast.success("PDF") },
    { label: "Enviar WhatsApp", icon: MessageCircle, fn: () => toast.info("WhatsApp") },
    { label: "Criar follow-up", icon: Clock, fn: followup },
    { label: "Aprovar cotação", icon: CheckCircle2, fn: () => onStatus(quote.id, "aprovado") },
    { label: "Marcar como perdida", icon: XCircle, fn: () => onStatus(quote.id, "perdido") },
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <span className="font-mono">{quote.internal_number}</span>
            {quote.is_aog && <StatusBadge label="AOG" tone="aog" />}
            <StatusBadge label={quoteStatus[quote.status]?.label ?? quote.status} tone={quoteStatus[quote.status]?.tone ?? "muted"} />
          </DialogTitle>
        </DialogHeader>

        {quote.is_aog && (
          <div className="flex items-center gap-2 rounded-lg border border-aog/30 bg-aog/10 px-3 py-2 text-sm font-medium text-aog">
            <AlertTriangle className="h-4 w-4" /> AOG — prioridade máxima.
          </div>
        )}
        {lowMargin && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/15 px-3 py-2 text-sm font-medium text-warning-foreground">
            <AlertTriangle className="h-4 w-4" /> {tr("Margem")} {Number(quote.real_margin ?? 0).toFixed(1)}% &lt; {minMargin}%
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Info label={tr("Cliente")} value={customerName} />
          <Info label={tr("Responsável")} value={quote.responsible} />
          <Info label={tr("Aeronave")} value={quote.aircraft} />
          <Info label={tr("Data")} value={fmtDate(quote.quote_date)} />
          <Info label={tr("Validade")} value={fmtDate(quote.valid_until)} />
          <Info label={tr("Câmbio")} value={quote.exchange_rate} />
          <Info label={tr("Custo fornecedor")} value={money(quote.supplier_cost)} />
          <Info label={tr("Frete")} value={money(quote.freight)} />
          <Info label={tr("Taxa import.")} value={money(quote.import_fee)} />
          <Info label={tr("Margem desejada")} value={`${quote.desired_margin ?? 0}%`} />
          <Info label={tr("Preço final")} value={money(quote.final_price)} />
          <Info label={tr("Margem real")} value={`${Number(quote.real_margin ?? 0).toFixed(1)}%`} />
        </div>

        {quote.notes && <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{quote.notes}</p>}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {actions.map((a) => (
            <Button key={a.label} variant="outline" size="sm" className="justify-start" onClick={a.fn}>
              <a.icon className="mr-1.5 h-4 w-4" /> {tr(a.label)}
            </Button>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>{tr("Fechar")}</Button>
          <Button onClick={onEdit}>{tr("Editar")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value ?? "—"}</p>
    </div>
  );
}
