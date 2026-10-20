import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Truck, Plus, Archive, Star, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { Button } from "@/components/ui/button";
import { useRows, useSaveRow, useArchiveRow } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/fornecedores")({
  component: FornecedoresPage,
});

const fields: Field[] = [
  { name: "name", label: "Nome", required: true },
  { name: "website", label: "Site" },
  { name: "login", label: "Login" },
  { name: "password_encrypted", label: "Senha (armazenada com segurança)" },
  { name: "contact", label: "Contato" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "phone", label: "Telefone" },
  { name: "country", label: "País" },
  { name: "part_type", label: "Tipo de peça" },
  { name: "manufacturers_served", label: "Fabricantes atendidos" },
  { name: "conditions_offered", label: "Condições oferecidas" },
  { name: "avg_lead_time", label: "Prazo médio" },
  { name: "certifications", label: "Certificações fornecidas" },
  { name: "internal_rating", label: "Avaliação interna (1-5)", type: "number" },
  { name: "notes", label: "Observações", type: "textarea" },
];

function FornecedoresPage() {
  const { data = [], isLoading } = useRows<any>("suppliers");
  const save = useSaveRow("suppliers");
  const archive = useArchiveRow("suppliers");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  return (
    <div>
      <PageHeader
        icon={Truck}
        title="Fornecedores"
        subtitle="Rede global de suprimento de peças aeronáuticas"
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1.5 h-4 w-4" /> Novo fornecedor</Button>}
      />
      <DataTable
        rows={data}
        loading={isLoading}
        searchKeys={["name", "part_type", "country", "manufacturers_served"]}
        onRowClick={(r) => { setEditing(r); setOpen(true); }}
        columns={[
          { key: "name", header: "Fornecedor", render: (r) => (
            <div><p className="font-medium text-foreground">{r.name}</p><p className="text-xs text-muted-foreground">{r.country ?? "—"}</p></div>
          ) },
          { key: "part_type", header: "Tipo", render: (r) => <span className="text-xs">{r.part_type ?? "—"}</span> },
          { key: "avg_lead_time", header: "Prazo", render: (r) => <span className="text-xs">{r.avg_lead_time ?? "—"}</span> },
          { key: "certifications", header: "Certificações", render: (r) => <span className="text-xs">{r.certifications ?? "—"}</span> },
          { key: "internal_rating", header: "Nota", render: (r) => (
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={"h-3.5 w-3.5 " + (i < (r.internal_rating ?? 0) ? "fill-gold text-gold" : "text-muted-foreground/30")} />
              ))}
            </div>
          ) },
          { key: "actions", header: "", render: (r) => (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              {r.website && <a href={r.website.startsWith("http") ? r.website : `https://${r.website}`} target="_blank" rel="noreferrer"><Button size="icon" variant="ghost" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button></a>}
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => archive.mutate(r.id)}><Archive className="h-4 w-4" /></Button>
            </div>
          ), className: "text-right" },
        ]}
      />
      <RecordDialog open={open} onOpenChange={setOpen} title={editing ? "Editar fornecedor" : "Novo fornecedor"} fields={fields} initial={editing} saving={save.isPending} onSave={(v) => save.mutate(v, { onSuccess: () => setOpen(false) })} />
    </div>
  );
}
