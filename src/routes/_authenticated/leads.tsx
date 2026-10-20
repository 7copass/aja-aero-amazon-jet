import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { UserPlus, Plus, Archive, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { Button } from "@/components/ui/button";
import { useRows, useSaveRow, useArchiveRow } from "@/lib/db";
import { leadStatus } from "@/lib/status";

export const Route = createFileRoute("/_authenticated/leads")({
  component: LeadsPage,
});

const fields: Field[] = [
  { name: "name", label: "Nome", required: true },
  { name: "company", label: "Empresa" },
  { name: "whatsapp", label: "WhatsApp" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "source", label: "Origem do lead" },
  { name: "aircraft", label: "Aeronave" },
  { name: "pn_requested", label: "PN solicitado" },
  { name: "quantity", label: "Quantidade", type: "number" },
  { name: "desired_condition", label: "Condição desejada" },
  { name: "urgency", label: "Urgência", type: "select", options: [
    { value: "normal", label: "Normal" }, { value: "aog", label: "AOG" },
  ] },
  { name: "status", label: "Status", type: "select", options: Object.entries(leadStatus).map(([v, e]) => ({ value: v, label: e.label })) },
  { name: "responsible", label: "Responsável" },
  { name: "notes", label: "Observações", type: "textarea" },
];

function LeadsPage() {
  const { data = [], isLoading } = useRows<any>("leads");
  const save = useSaveRow("leads");
  const archive = useArchiveRow("leads");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  return (
    <div>
      <PageHeader
        icon={UserPlus}
        title="Leads"
        subtitle="Captação e qualificação de oportunidades"
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" /> Novo lead
          </Button>
        }
      />
      <DataTable
        rows={data}
        loading={isLoading}
        searchKeys={["name", "company", "pn_requested", "email"]}
        onRowClick={(r) => { setEditing(r); setOpen(true); }}
        columns={[
          { key: "name", header: "Nome", render: (r) => (
            <div>
              <p className="font-medium text-foreground">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.company ?? "—"}</p>
            </div>
          ) },
          { key: "pn_requested", header: "PN", render: (r) => <span className="font-mono text-xs">{r.pn_requested ?? "—"}</span> },
          { key: "aircraft", header: "Aeronave" },
          { key: "urgency", header: "Urgência", render: (r) =>
            r.urgency === "aog" ? <StatusBadge label="AOG" tone="aog" /> : <span className="text-xs text-muted-foreground">Normal</span> },
          { key: "status", header: "Status", render: (r) => {
            const s = leadStatus[r.status] ?? { label: r.status, tone: "muted" as const };
            return <StatusBadge label={s.label} tone={s.tone} />;
          } },
          { key: "responsible", header: "Responsável" },
          { key: "actions", header: "", render: (r) => (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              {r.whatsapp && (
                <a href={`https://wa.me/${String(r.whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                  <Button size="icon" variant="ghost" className="h-8 w-8"><MessageCircle className="h-4 w-4" /></Button>
                </a>
              )}
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => archive.mutate(r.id)}>
                <Archive className="h-4 w-4" />
              </Button>
            </div>
          ), className: "text-right" },
        ]}
      />
      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar lead" : "Novo lead"}
        fields={fields}
        initial={editing}
        saving={save.isPending}
        onSave={(v) => save.mutate(v, { onSuccess: () => setOpen(false) })}
      />
    </div>
  );
}
