import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Award, Plus, Archive, Upload, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { Button } from "@/components/ui/button";
import { useRows, useSaveRow, useArchiveRow } from "@/lib/db";
import { certStatus, certType } from "@/lib/status";
import { fmtDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/certificados")({
  component: CertificadosPage,
});

function CertificadosPage() {
  const { data = [], isLoading } = useRows<any>("certificates");
  const { data: suppliers = [] } = useRows<any>("suppliers");
  const { data: quotes = [] } = useRows<any>("quotes");
  const save = useSaveRow("certificates");
  const archive = useArchiveRow("certificates");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const pending = data.filter((c) => c.required && c.status !== "aprovado").length;

  const fields: Field[] = [
    { name: "pn", label: "PN", required: true },
    { name: "serial_number", label: "Serial Number" },
    { name: "cert_type", label: "Tipo", type: "select", options: Object.entries(certType).map(([v, l]) => ({ value: v, label: l })) },
    { name: "supplier_id", label: "Fornecedor", type: "select", options: suppliers.map((s) => ({ value: s.id, label: s.name })) },
    { name: "quote_id", label: "Cotação", type: "select", options: quotes.map((q) => ({ value: q.id, label: q.internal_number })) },
    { name: "issue_date", label: "Data emissão", type: "date" },
    { name: "valid_until", label: "Validade", type: "date" },
    { name: "required", label: "Certificado obrigatório", type: "switch" },
    { name: "status", label: "Status", type: "select", options: Object.entries(certStatus).map(([v, e]) => ({ value: v, label: e.label })) },
    { name: "file_url", label: "Link do arquivo" },
    { name: "notes", label: "Observações", type: "textarea" },
  ];

  return (
    <div>
      <PageHeader
        icon={Award}
        title="Certificados"
        subtitle="FAA 8130-3, EASA Form 1, COC, Trace e mais"
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1.5 h-4 w-4" /> Novo certificado</Button>}
      />
      {pending > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-warning/40 bg-warning/15 px-4 py-3 text-sm font-medium text-warning-foreground">
          <AlertTriangle className="h-4 w-4" />
          {pending} certificado(s) obrigatório(s) pendente(s). Nenhuma compra pode ser concluída sem certificado aprovado.
        </div>
      )}
      <DataTable
        rows={data}
        loading={isLoading}
        searchKeys={["pn", "serial_number"]}
        onRowClick={(r) => { setEditing(r); setOpen(true); }}
        columns={[
          { key: "pn", header: "PN", render: (r) => <span className="font-mono text-xs font-semibold">{r.pn}</span> },
          { key: "serial_number", header: "Serial", render: (r) => <span className="font-mono text-xs">{r.serial_number ?? "—"}</span> },
          { key: "cert_type", header: "Tipo", render: (r) => <span className="text-xs">{certType[r.cert_type] ?? "—"}</span> },
          { key: "required", header: "Obrigatório", render: (r) => r.required ? <StatusBadge label="Sim" tone="navy" /> : <span className="text-xs text-muted-foreground">Não</span> },
          { key: "issue_date", header: "Emissão", render: (r) => <span className="text-xs">{fmtDate(r.issue_date)}</span> },
          { key: "status", header: "Status", render: (r) => <StatusBadge label={certStatus[r.status]?.label ?? r.status} tone={certStatus[r.status]?.tone ?? "muted"} /> },
          { key: "actions", header: "", render: (r) => (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Button size="icon" variant="ghost" className="h-8 w-8" title="Upload" onClick={() => toast.info("Upload de arquivo (preparado)")}><Upload className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => archive.mutate(r.id)}><Archive className="h-4 w-4" /></Button>
            </div>
          ), className: "text-right" },
        ]}
      />
      <RecordDialog open={open} onOpenChange={setOpen} title={editing ? "Editar certificado" : "Novo certificado"} fields={fields} initial={editing} saving={save.isPending} onSave={(v) => save.mutate(v, { onSuccess: () => setOpen(false) })} />
    </div>
  );
}
