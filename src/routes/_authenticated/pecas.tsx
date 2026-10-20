import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Package, Plus, Archive } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { Button } from "@/components/ui/button";
import { useRows, useSaveRow, useArchiveRow } from "@/lib/db";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/pecas")({
  component: PecasPage,
});

const fields: Field[] = [
  { name: "pn", label: "PN", required: true },
  { name: "description", label: "Descrição" },
  { name: "manufacturer", label: "Fabricante" },
  { name: "application", label: "Aplicação" },
  { name: "compatible_aircraft", label: "Aeronaves compatíveis" },
  { name: "ata_chapter", label: "ATA Chapter" },
  { name: "conditions_available", label: "Condições disponíveis" },
  { name: "alternate_pn", label: "PN alternativo" },
  { name: "superseded_pn", label: "PN superseded" },
  { name: "estimated_weight", label: "Peso estimado (kg)", type: "number" },
  { name: "dimensions", label: "Dimensões" },
  { name: "required_certification", label: "Certificação necessária" },
  { name: "last_price", label: "Último preço (USD)", type: "number" },
  { name: "notes", label: "Observações", type: "textarea" },
];

function PecasPage() {
  const { data = [], isLoading } = useRows<any>("parts");
  const save = useSaveRow("parts");
  const archive = useArchiveRow("parts");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  return (
    <div>
      <PageHeader
        icon={Package}
        title="Peças / PN"
        subtitle="Catálogo técnico de part numbers"
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1.5 h-4 w-4" /> Nova peça</Button>}
      />
      <DataTable
        rows={data}
        loading={isLoading}
        searchKeys={["pn", "description", "manufacturer", "compatible_aircraft"]}
        onRowClick={(r) => { setEditing(r); setOpen(true); }}
        columns={[
          { key: "pn", header: "PN", render: (r) => <span className="font-mono text-xs font-semibold text-foreground">{r.pn}</span> },
          { key: "description", header: "Descrição" },
          { key: "manufacturer", header: "Fabricante", render: (r) => <span className="text-xs">{r.manufacturer ?? "—"}</span> },
          { key: "ata_chapter", header: "ATA", render: (r) => <span className="text-xs">{r.ata_chapter ?? "—"}</span> },
          { key: "conditions_available", header: "Condições", render: (r) => <span className="text-xs">{r.conditions_available ?? "—"}</span> },
          { key: "last_price", header: "Último preço", render: (r) => <span className="font-medium">{r.last_price ? money(r.last_price) : "—"}</span> },
          { key: "actions", header: "", render: (r) => (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => archive.mutate(r.id)}><Archive className="h-4 w-4" /></Button>
            </div>
          ), className: "text-right" },
        ]}
      />
      <RecordDialog open={open} onOpenChange={setOpen} title={editing ? "Editar peça" : "Nova peça"} fields={fields} initial={editing} saving={save.isPending} onSave={(v) => save.mutate(v, { onSuccess: () => setOpen(false) })} />
    </div>
  );
}
