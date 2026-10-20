import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users, Plus, Archive, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { Button } from "@/components/ui/button";
import { useRows, useSaveRow, useArchiveRow } from "@/lib/db";
import { customerType } from "@/lib/status";

export const Route = createFileRoute("/_authenticated/clientes")({
  component: ClientesPage,
});

const fields: Field[] = [
  { name: "name", label: "Nome", required: true },
  { name: "company", label: "Empresa" },
  { name: "tax_id", label: "CNPJ/CPF ou Tax ID" },
  { name: "phone", label: "Telefone" },
  { name: "whatsapp", label: "WhatsApp" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "country", label: "País" },
  { name: "state", label: "Estado" },
  { name: "city", label: "Cidade" },
  { name: "address", label: "Endereço", full: true },
  { name: "type", label: "Tipo", type: "select", options: Object.entries(customerType).map(([v, l]) => ({ value: v, label: l })) },
  { name: "aircraft_operated", label: "Aeronaves operadas" },
  { name: "notes", label: "Observações", type: "textarea" },
];

function ClientesPage() {
  const { data = [], isLoading } = useRows<any>("customers");
  const save = useSaveRow("customers");
  const archive = useArchiveRow("customers");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Clientes"
        subtitle="Operadores, oficinas, táxis aéreos e proprietários"
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1.5 h-4 w-4" /> Novo cliente</Button>}
      />
      <DataTable
        rows={data}
        loading={isLoading}
        searchKeys={["name", "company", "city", "email"]}
        onRowClick={(r) => { setEditing(r); setOpen(true); }}
        columns={[
          { key: "name", header: "Cliente", render: (r) => (
            <div><p className="font-medium text-foreground">{r.name}</p><p className="text-xs text-muted-foreground">{r.company ?? "—"}</p></div>
          ) },
          { key: "type", header: "Tipo", render: (r) => <span className="text-xs">{customerType[r.type] ?? "—"}</span> },
          { key: "city", header: "Local", render: (r) => <span className="text-xs">{[r.city, r.state].filter(Boolean).join(", ") || "—"}</span> },
          { key: "aircraft_operated", header: "Aeronaves", render: (r) => <span className="text-xs">{r.aircraft_operated ?? "—"}</span> },
          { key: "email", header: "Contato", render: (r) => <span className="text-xs text-muted-foreground">{r.email ?? r.phone ?? "—"}</span> },
          { key: "actions", header: "", render: (r) => (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              {r.whatsapp && <a href={`https://wa.me/${String(r.whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><Button size="icon" variant="ghost" className="h-8 w-8"><MessageCircle className="h-4 w-4" /></Button></a>}
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => archive.mutate(r.id)}><Archive className="h-4 w-4" /></Button>
            </div>
          ), className: "text-right" },
        ]}
      />
      <RecordDialog open={open} onOpenChange={setOpen} title={editing ? "Editar cliente" : "Novo cliente"} fields={fields} initial={editing} saving={save.isPending} onSave={(v) => save.mutate(v, { onSuccess: () => setOpen(false) })} />
    </div>
  );
}
