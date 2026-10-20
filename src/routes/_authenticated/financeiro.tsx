import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DollarSign, FileDown, TrendingUp, Plus, Archive } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRows, useSaveRow, useArchiveRow } from "@/lib/db";
import { finStatus } from "@/lib/status";
import { money, fmtDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/financeiro")({
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const { data: estimates = [] } = useRows<any>("estimates");
  const { data: invoices = [] } = useRows<any>("invoices");
  const { data: pos = [] } = useRows<any>("purchase_orders");
  const { data: payments = [] } = useRows<any>("payments");
  const { data: expenses = [] } = useRows<any>("expenses");
  const { data: customers = [] } = useRows<any>("customers");

  const custName = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";

  const received = payments.filter((p) => p.type === "recebido").reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const sent = payments.filter((p) => p.type === "enviado").reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const receivable = invoices.filter((i) => !["pago", "cancelado"].includes(i.status)).reduce((s, i) => s + Number(i.total ?? 0), 0);
  const payable = pos.filter((p) => ["aguardando_pagamento"].includes(p.status)).reduce((s, p) => s + Number(p.total ?? 0), 0);
  const opex = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const grossProfit = received - sent - opex;

  return (
    <div>
      <PageHeader
        icon={DollarSign}
        title="Financeiro"
        subtitle="Estrutura interna preparada para substituir o QuickBooks"
        actions={<Button variant="outline" onClick={() => toast.success("Relatório financeiro gerado (PDF)")}><FileDown className="mr-1.5 h-4 w-4" /> Relatório</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pagamentos recebidos" value={money(received)} icon={DollarSign} tone="success" />
        <StatCard label="Contas a receber" value={money(receivable)} icon={DollarSign} tone="gold" />
        <StatCard label="Contas a pagar" value={money(payable)} icon={DollarSign} tone="warning" />
        <StatCard label="Lucro bruto" value={money(grossProfit)} icon={TrendingUp} tone="navy" />
      </div>

      <Tabs defaultValue="estimates">
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="estimates">Estimates</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="receber">Contas a receber</TabsTrigger>
          <TabsTrigger value="pagar">Contas a pagar</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
        </TabsList>

        <TabsContent value="estimates"><FinDocs table="estimates" numberKey="estimate_number" customers={customers} custName={custName} docLabel="Estimate" /></TabsContent>
        <TabsContent value="invoices"><FinDocs table="invoices" numberKey="invoice_number" customers={customers} custName={custName} docLabel="Invoice" /></TabsContent>

        <TabsContent value="receber">
          <DataTable rows={invoices.filter((i) => !["pago", "cancelado"].includes(i.status))} searchKeys={["invoice_number"]}
            columns={[
              { key: "invoice_number", header: "Invoice", render: (r) => <span className="font-mono text-xs font-semibold">{r.invoice_number}</span> },
              { key: "customer", header: "Cliente", render: (r) => custName(r.customer_id) },
              { key: "due_date", header: "Vencimento", render: (r) => <span className="text-xs">{fmtDate(r.due_date)}</span> },
              { key: "total", header: "Valor", render: (r) => <span className="font-medium">{money(r.total)}</span> },
              { key: "status", header: "Status", render: (r) => <StatusBadge label={finStatus[r.status]?.label ?? r.status} tone={finStatus[r.status]?.tone ?? "muted"} /> },
            ]} />
        </TabsContent>

        <TabsContent value="pagar">
          <DataTable rows={pos.filter((p) => p.status === "aguardando_pagamento")} searchKeys={["po_number"]}
            columns={[
              { key: "po_number", header: "PO", render: (r) => <span className="font-mono text-xs font-semibold">{r.po_number}</span> },
              { key: "total", header: "Valor", render: (r) => <span className="font-medium">{money(r.total)}</span> },
              { key: "payment_method", header: "Forma", render: (r) => <span className="text-xs">{r.payment_method ?? "—"}</span> },
              { key: "status", header: "Status", render: () => <StatusBadge label="Aguardando pagamento" tone="warning" /> },
            ]} />
        </TabsContent>

        <TabsContent value="pagamentos">
          <DataTable rows={payments}
            columns={[
              { key: "type", header: "Tipo", render: (r) => r.type === "recebido" ? <StatusBadge label="Recebido" tone="success" /> : <StatusBadge label="Enviado" tone="navy" /> },
              { key: "amount", header: "Valor", render: (r) => <span className="font-medium">{money(r.amount)}</span> },
              { key: "method", header: "Método", render: (r) => <span className="text-xs">{r.method ?? "—"}</span> },
              { key: "payment_date", header: "Data", render: (r) => <span className="text-xs">{fmtDate(r.payment_date)}</span> },
            ]} />
        </TabsContent>

        <TabsContent value="despesas">
          <DataTable rows={expenses} searchKeys={["description", "category"]}
            columns={[
              { key: "description", header: "Descrição" },
              { key: "category", header: "Categoria", render: (r) => <span className="text-xs">{r.category ?? "—"}</span> },
              { key: "amount", header: "Valor", render: (r) => <span className="font-medium">{money(r.amount)}</span> },
              { key: "expense_date", header: "Data", render: (r) => <span className="text-xs">{fmtDate(r.expense_date)}</span> },
            ]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FinDocs({ table, numberKey, customers, custName, docLabel }: any) {
  const { data = [], isLoading } = useRows<any>(table);
  const save = useSaveRow(table);
  const archive = useArchiveRow(table);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const fields: Field[] = ([
    { name: numberKey, label: `Número ${docLabel}`, required: true },
    { name: "customer_id", label: "Cliente", type: "select", options: customers.map((c: any) => ({ value: c.id, label: c.name })) },
    { name: "total", label: "Total (USD)", type: "number" },
    { name: "status", label: "Status", type: "select", options: Object.entries(finStatus).map(([v, e]: any) => ({ value: v, label: e.label })) },
    { name: "valid_until", label: "Validade", type: "date" },
    { name: "due_date", label: "Vencimento", type: "date" },
    { name: "terms", label: "Termos comerciais" },
    { name: "notes", label: "Observações", type: "textarea" },
  ] as Field[]).filter((f) => {
    if (table === "estimates" && f.name === "due_date") return false;
    if (table === "invoices" && f.name === "valid_until") return false;
    return true;
  });

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1.5 h-4 w-4" /> Novo {docLabel}</Button>
      </div>
      <DataTable
        rows={data}
        loading={isLoading}
        searchKeys={[numberKey]}
        onRowClick={(r) => { setEditing(r); setOpen(true); }}
        columns={[
          { key: numberKey, header: docLabel, render: (r) => <span className="font-mono text-xs font-semibold">{r[numberKey]}</span> },
          { key: "customer", header: "Cliente", render: (r) => custName(r.customer_id) },
          { key: "total", header: "Total", render: (r) => <span className="font-medium">{money(r.total)}</span> },
          { key: "status", header: "Status", render: (r) => <StatusBadge label={finStatus[r.status]?.label ?? r.status} tone={finStatus[r.status]?.tone ?? "muted"} /> },
          { key: "actions", header: "", render: (r) => (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Button size="icon" variant="ghost" className="h-8 w-8" title="Gerar PDF" onClick={() => toast.success(`${docLabel} ${r[numberKey]} — PDF gerado`)}><FileDown className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => archive.mutate(r.id)}><Archive className="h-4 w-4" /></Button>
            </div>
          ), className: "text-right" },
        ]}
      />
      <RecordDialog open={open} onOpenChange={setOpen} title={editing ? `Editar ${docLabel}` : `Novo ${docLabel}`} fields={fields} initial={editing} saving={save.isPending} onSave={(v) => save.mutate(v, { onSuccess: () => setOpen(false) })} />
    </>
  );
}
