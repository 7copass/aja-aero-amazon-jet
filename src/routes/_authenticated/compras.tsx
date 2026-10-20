import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart, Plus, Archive, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { Button } from "@/components/ui/button";
import { useRows, useSaveRow, useArchiveRow, nextDocumentNumber } from "@/lib/db";
import { poStatus } from "@/lib/status";
import { money, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/compras")({
  component: ComprasPage,
});

function ComprasPage() {
  const { data = [], isLoading } = useRows<any>("purchase_orders");
  const { data: suppliers = [] } = useRows<any>("suppliers");
  const { data: quotes = [] } = useRows<any>("quotes");
  const save = useSaveRow("purchase_orders");
  const archive = useArchiveRow("purchase_orders");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [prefill, setPrefill] = useState<any>(null);

  const openNew = async () => {
    const n = await nextDocumentNumber("po");
    setEditing(null);
    setPrefill(n ? { po_number: n } : null);
    setOpen(true);
  };

  const supName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? "—";
  const noCert = data.filter((p) => p.status === "liberado_logistica" && !p.certificate_received).length;

  const fields: Field[] = [
    { name: "po_number", label: "Número PO", required: true, placeholder: "PO-2026-00XX" },
    { name: "quote_id", label: "Cotação", type: "select", options: quotes.map((q) => ({ value: q.id, label: q.internal_number })) },
    { name: "supplier_id", label: "Fornecedor", type: "select", options: suppliers.map((s) => ({ value: s.id, label: s.name })) },
    { name: "total", label: "Valor de compra (USD)", type: "number" },
    { name: "purchase_date", label: "Data da compra", type: "date" },
    { name: "payment_method", label: "Forma de pagamento" },
    { name: "tracking", label: "Tracking" },
    { name: "certificate_received", label: "Certificado recebido", type: "switch" },
    { name: "status", label: "Status", type: "select", options: Object.entries(poStatus).map(([v, e]) => ({ value: v, label: e.label })) },
    { name: "notes", label: "Observações", type: "textarea" },
  ];

  return (
    <div>
      <PageHeader
        icon={ShoppingCart}
        title="Compras"
        subtitle="Purchase Orders e acompanhamento de pedidos"
        actions={<Button onClick={openNew}><Plus className="mr-1.5 h-4 w-4" /> Nova PO</Button>}
      />
      {noCert > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-aog/30 bg-aog/10 px-4 py-3 text-sm font-medium text-aog">
          <AlertTriangle className="h-4 w-4" /> {noCert} compra(s) liberada(s) sem certificado recebido.
        </div>
      )}
      <DataTable
        rows={data}
        loading={isLoading}
        searchKeys={["po_number", "tracking"]}
        onRowClick={(r) => { setEditing(r); setPrefill(null); setOpen(true); }}
        columns={[
          { key: "po_number", header: "PO", render: (r) => <span className="font-mono text-xs font-semibold">{r.po_number}</span> },
          { key: "supplier", header: "Fornecedor", render: (r) => supName(r.supplier_id) },
          { key: "total", header: "Valor", render: (r) => <span className="font-medium">{money(r.total)}</span> },
          { key: "purchase_date", header: "Data", render: (r) => <span className="text-xs">{fmtDate(r.purchase_date)}</span> },
          { key: "certificate_received", header: "Cert.", render: (r) => r.certificate_received ? <StatusBadge label="OK" tone="success" /> : <StatusBadge label="Pendente" tone="warning" /> },
          { key: "status", header: "Status", render: (r) => <StatusBadge label={poStatus[r.status]?.label ?? r.status} tone={poStatus[r.status]?.tone ?? "muted"} /> },
          { key: "actions", header: "", render: (r) => (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => archive.mutate(r.id)}><Archive className="h-4 w-4" /></Button>
            </div>
          ), className: "text-right" },
        ]}
      />
      <RecordDialog open={open} onOpenChange={setOpen} title={editing ? "Editar PO" : "Nova PO"} fields={fields} initial={editing ?? prefill} saving={save.isPending} onSave={(v) => save.mutate(v, { onSuccess: () => setOpen(false) })} />
    </div>
  );
}
