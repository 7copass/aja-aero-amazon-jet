import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send, Plus, Copy, Mail, Archive } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useRows, useSaveRow, useArchiveRow, nextDocumentNumber } from "@/lib/db";
import { rfqStatus } from "@/lib/status";
import { fmtDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/rfqs")({
  component: RfqsPage,
});

function buildMessage(pn = "", desc = "", qty = "", cond = "") {
  return `Hello,

We would like to request a quote for the following aircraft part:

PN: ${pn}
Description: ${desc}
Qty: ${qty}
Condition requested: ${cond}

Please confirm:
- Price
- Availability
- Lead time
- Certification
- Shipping options
- Core requirement, if applicable

Best regards,
Amazon Jet Aviation`;
}

function RfqsPage() {
  const { data: rfqs = [], isLoading } = useRows<any>("rfqs");
  const { data: suppliers = [] } = useRows<any>("suppliers");
  const { data: quotes = [] } = useRows<any>("quotes");
  const save = useSaveRow("rfqs");
  const archive = useArchiveRow("rfqs");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [prefill, setPrefill] = useState<any>(null);

  const openNew = async () => {
    const n = await nextDocumentNumber("rfq");
    setEditing(null);
    setPrefill(n ? { rfq_number: n } : null);
    setOpen(true);
  };
  const [msgOpen, setMsgOpen] = useState(false);
  const [msg, setMsg] = useState("");

  const supName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? "—";

  const fields: Field[] = [
    { name: "rfq_number", label: "Número RFQ", required: true, placeholder: "RFQ-2026-00XX" },
    { name: "quote_id", label: "Cotação", type: "select", options: quotes.map((q) => ({ value: q.id, label: q.internal_number })) },
    { name: "supplier_id", label: "Fornecedor", type: "select", options: suppliers.map((s) => ({ value: s.id, label: s.name })) },
    { name: "supplier_email", label: "E-mail fornecedor", type: "email" },
    { name: "status", label: "Status", type: "select", options: Object.entries(rfqStatus).map(([v, e]) => ({ value: v, label: e.label })) },
    { name: "sent_date", label: "Data envio", type: "date" },
    { name: "response_date", label: "Data resposta", type: "date" },
    { name: "notes", label: "Observações", type: "textarea" },
  ];

  return (
    <div>
      <PageHeader
        icon={Send}
        title="RFQs"
        subtitle="Requisições de cotação aos fornecedores"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setMsg(buildMessage()); setMsgOpen(true); }}>
              <Mail className="mr-1.5 h-4 w-4" /> Modelo RFQ
            </Button>
            <Button onClick={openNew}><Plus className="mr-1.5 h-4 w-4" /> Novo RFQ</Button>
          </div>
        }
      />
      <DataTable
        rows={rfqs}
        loading={isLoading}
        searchKeys={["rfq_number"]}
        onRowClick={(r) => { setEditing(r); setPrefill(null); setOpen(true); }}
        columns={[
          { key: "rfq_number", header: "RFQ", render: (r) => <span className="font-mono text-xs font-semibold">{r.rfq_number}</span> },
          { key: "supplier", header: "Fornecedor", render: (r) => supName(r.supplier_id) },
          { key: "sent_date", header: "Envio", render: (r) => <span className="text-xs">{fmtDate(r.sent_date)}</span> },
          { key: "response_date", header: "Resposta", render: (r) => <span className="text-xs">{fmtDate(r.response_date)}</span> },
          { key: "status", header: "Status", render: (r) => <StatusBadge label={rfqStatus[r.status]?.label ?? r.status} tone={rfqStatus[r.status]?.tone ?? "muted"} /> },
          { key: "actions", header: "", render: (r) => (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Button size="icon" variant="ghost" className="h-8 w-8" title="Enviar por e-mail"
                onClick={() => toast.success("RFQ enviado por e-mail (simulado)")}><Mail className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => archive.mutate(r.id)}><Archive className="h-4 w-4" /></Button>
            </div>
          ), className: "text-right" },
        ]}
      />

      <RecordDialog open={open} onOpenChange={setOpen} title={editing ? "Editar RFQ" : "Novo RFQ"} fields={fields} initial={editing ?? prefill} saving={save.isPending} onSave={(v) => save.mutate(v, { onSuccess: () => setOpen(false) })} />

      <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Modelo de mensagem RFQ (EN)</DialogTitle></DialogHeader>
          <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={18} className="font-mono text-xs" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(msg); toast.success("Mensagem copiada"); }}>
              <Copy className="mr-1.5 h-4 w-4" /> Copiar mensagem
            </Button>
            <Button onClick={() => { toast.success("RFQ enviado (simulado)"); setMsgOpen(false); }}>
              <Send className="mr-1.5 h-4 w-4" /> Enviar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
