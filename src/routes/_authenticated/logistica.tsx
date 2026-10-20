import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plane, Plus, Archive } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { Button } from "@/components/ui/button";
import { useRows, useSaveRow, useArchiveRow } from "@/lib/db";
import { logisticsStatus } from "@/lib/status";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/logistica")({
  component: LogisticaPage,
});

function LogisticaPage() {
  const { data = [], isLoading } = useRows<any>("logistics");
  const { data: customers = [] } = useRows<any>("customers");
  const { data: invoices = [] } = useRows<any>("invoices");
  const save = useSaveRow("logistics");
  const archive = useArchiveRow("logistics");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const custName = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";

  const fields: Field[] = [
    { name: "invoice_id", label: "Invoice", type: "select", options: invoices.map((i) => ({ value: i.id, label: i.invoice_number })) },
    { name: "customer_id", label: "Cliente", type: "select", options: customers.map((c) => ({ value: c.id, label: c.name })) },
    { name: "pn", label: "PN" },
    { name: "supplier_tracking", label: "Tracking fornecedor" },
    { name: "carrier", label: "Transportadora" },
    { name: "weight", label: "Peso (kg)", type: "number" },
    { name: "dimensions", label: "Dimensões" },
    { name: "destination_address", label: "Endereço de destino", full: true },
    { name: "expected_date", label: "Data prevista", type: "date" },
    { name: "delivered_date", label: "Data entregue", type: "date" },
    { name: "status", label: "Status", type: "select", options: Object.entries(logisticsStatus).map(([v, e]) => ({ value: v, label: e.label })) },
    { name: "notes", label: "Observações", type: "textarea" },
  ];

  return (
    <div>
      <PageHeader
        icon={Plane}
        title="Logística"
        subtitle="Trânsito Deerfield → Brasil e nacionalização"
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1.5 h-4 w-4" /> Novo processo</Button>}
      />
      <DataTable
        rows={data}
        loading={isLoading}
        searchKeys={["pn", "supplier_tracking", "carrier"]}
        onRowClick={(r) => { setEditing(r); setOpen(true); }}
        columns={[
          { key: "pn", header: "PN", render: (r) => <span className="font-mono text-xs font-semibold">{r.pn ?? "—"}</span> },
          { key: "customer", header: "Cliente", render: (r) => custName(r.customer_id) },
          { key: "carrier", header: "Transportadora", render: (r) => <span className="text-xs">{r.carrier ?? "—"}</span> },
          { key: "supplier_tracking", header: "Tracking", render: (r) => <span className="font-mono text-xs">{r.supplier_tracking ?? "—"}</span> },
          { key: "expected_date", header: "Previsão", render: (r) => <span className="text-xs">{fmtDate(r.expected_date)}</span> },
          { key: "status", header: "Status", render: (r) => <StatusBadge label={logisticsStatus[r.status]?.label ?? r.status} tone={logisticsStatus[r.status]?.tone ?? "muted"} /> },
          { key: "actions", header: "", render: (r) => (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => archive.mutate(r.id)}><Archive className="h-4 w-4" /></Button>
            </div>
          ), className: "text-right" },
        ]}
      />
      <RecordDialog open={open} onOpenChange={setOpen} title={editing ? "Editar processo" : "Novo processo logístico"} fields={fields} initial={editing} saving={save.isPending} onSave={(v) => save.mutate(v, { onSuccess: () => setOpen(false) })} />
    </div>
  );
}
