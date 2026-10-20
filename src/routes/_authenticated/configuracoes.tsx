import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Settings, Users, SlidersHorizontal, FileText, Plug, ScrollText, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { DataTable } from "@/components/DataTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRows } from "@/lib/db";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUsersWithRoles, highestRole, type UserWithRoles } from "@/hooks/useUserRoles";
import { UserAccessDialog } from "@/components/UserAccessDialog";
import { roleLabels } from "@/lib/status";
import { fmtDateTime } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const { data: logs = [] } = useRows<any>("activity_logs", { order: "created_at", ascending: false });
  const { data: settings = [] } = useRows<any>("settings");

  const company = settings.find((s) => s.key === "company")?.value ?? {};
  const finance = settings.find((s) => s.key === "finance")?.value ?? {};

  return (
    <div>
      <PageHeader icon={Settings} title="Configurações" subtitle="Empresa, usuários, parâmetros e integrações" />
      <Tabs defaultValue="empresa">
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="empresa"><FileText className="mr-1.5 h-4 w-4" />Empresa</TabsTrigger>
          <TabsTrigger value="usuarios"><Users className="mr-1.5 h-4 w-4" />Usuários</TabsTrigger>
          <TabsTrigger value="parametros"><SlidersHorizontal className="mr-1.5 h-4 w-4" />Parâmetros</TabsTrigger>
          <TabsTrigger value="integracoes"><Plug className="mr-1.5 h-4 w-4" />Integrações</TabsTrigger>
          <TabsTrigger value="logs"><ScrollText className="mr-1.5 h-4 w-4" />Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <div className="grid max-w-2xl grid-cols-1 gap-4 rounded-xl border bg-card p-5 shadow-card sm:grid-cols-2">
            <FieldRow label="Nome da empresa" value={company.name ?? "Amazon Jet Aviation"} />
            <FieldRow label="Marca" value={company.brand ?? "AJA Aero ERP"} />
            <FieldRow label="Endereço" value={company.address ?? ""} />
            <FieldRow label="E-mail" value={company.email ?? ""} />
            <FieldRow label="Telefone" value={company.phone ?? ""} />
            <div className="sm:col-span-2"><Button onClick={() => toast.success("Dados da empresa salvos")}>Salvar</Button></div>
          </div>
        </TabsContent>

        <TabsContent value="usuarios">
          <UsuariosTab />
        </TabsContent>

        <TabsContent value="parametros">
          <div className="grid max-w-2xl grid-cols-1 gap-4 rounded-xl border bg-card p-5 shadow-card sm:grid-cols-2">
            <FieldRow label="Margem mínima (%)" value={String(finance.min_margin ?? 20)} />
            <FieldRow label="Taxa import./logística (%)" value={String(finance.import_fee_pct ?? 12)} />
            <FieldRow label="Câmbio padrão" value={String(finance.default_exchange ?? 5.15)} />
            <FieldRow label="Condições de pagamento" value={finance.payment_terms ?? ""} />
            <div className="sm:col-span-2"><Button onClick={() => toast.success("Parâmetros salvos")}>Salvar</Button></div>
          </div>
        </TabsContent>

        <TabsContent value="integracoes">
          <div className="grid max-w-2xl grid-cols-1 gap-3">
            {["QuickBooks", "WhatsApp Business", "E-mail (SMTP)", "OpenAI / Lovable AI"].map((name) => (
              <div key={name} className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-soft">
                <div>
                  <p className="font-medium text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">Preparado para conexão via API</p>
                </div>
                <Switch onCheckedChange={() => toast.info(`${name}: configuração via API (preparada)`)} />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <DataTable
            rows={logs}
            searchKeys={["action", "entity", "user_name"]}
            empty="Nenhuma ação registrada ainda."
            columns={[
              { key: "created_at", header: "Quando", render: (r) => <span className="text-xs">{fmtDateTime(r.created_at)}</span> },
              { key: "user_name", header: "Usuário", render: (r) => <span className="text-xs">{r.user_name ?? "—"}</span> },
              { key: "entity", header: "Módulo", render: (r) => <StatusBadge label={r.entity ?? "—"} tone="muted" /> },
              { key: "action", header: "Ação" },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsuariosTab() {
  const { data: me } = useCurrentUser();
  const { data: users = [], isLoading } = useUsersWithRoles();
  const [editing, setEditing] = useState<UserWithRoles | null>(null);

  const isAdmin = !!me?.roles?.includes("admin");
  const adminCount = users.filter((u) => u.roles.includes("admin")).length;

  return (
    <>
      {!isAdmin && (
        <p className="mb-3 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          Apenas administradores podem ver e alterar as permissões da equipe.
        </p>
      )}
      <DataTable
        rows={users}
        loading={isLoading}
        searchKeys={["full_name", "email", "department"]}
        onRowClick={isAdmin ? (r) => setEditing(r as UserWithRoles) : undefined}
        empty="Nenhum usuário cadastrado ainda."
        columns={[
          { key: "full_name", header: "Nome", render: (r) => (
            <div>
              <p className="font-medium text-foreground">{r.full_name ?? "—"}</p>
              <p className="text-xs text-muted-foreground">{r.email}</p>
            </div>
          ) },
          { key: "roles", header: "Permissões", render: (r) => (
            r.roles.length === 0
              ? <span className="text-xs text-muted-foreground">Sem acesso</span>
              : (
                <div className="flex flex-wrap gap-1">
                  {r.roles.map((role: string) => (
                    <StatusBadge
                      key={role}
                      label={roleLabels[role] ?? role}
                      tone={role === "admin" ? "gold" : role === "ceo" ? "navy" : "muted"}
                    />
                  ))}
                </div>
              )
          ) },
          { key: "department", header: "Departamento", render: (r) => (
            <span className="text-xs">{r.department ?? "—"}</span>
          ) },
          { key: "created_at", header: "Criado em", render: (r) => (
            <span className="text-xs">{fmtDateTime(r.created_at)}</span>
          ) },
          { key: "actions", header: "", render: (r) => (
            isAdmin ? (
              <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="outline" onClick={() => setEditing(r as UserWithRoles)}>
                  <ShieldCheck className="mr-1.5 h-4 w-4" /> Permissões
                </Button>
              </div>
            ) : null
          ), className: "text-right" },
        ]}
      />
      <p className="mt-3 text-xs text-muted-foreground">
        O primeiro usuário cadastrado vira administrador automaticamente. O papel em vigor no
        cabeçalho é o de maior autoridade: {highestRole(me?.roles) ? roleLabels[highestRole(me?.roles)!] : "—"}.
      </p>

      <UserAccessDialog
        user={editing}
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        isSelf={editing?.id === me?.id}
        adminCount={adminCount}
      />
    </>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      <Input defaultValue={value} />
    </div>
  );
}
