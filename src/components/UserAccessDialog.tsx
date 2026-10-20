import { useEffect, useState } from "react";
import { ShieldCheck, Info } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { roleLabels } from "@/lib/status";
import { cn } from "@/lib/utils";
import {
  ROLE_RANK, useSaveProfile, useSetUserRoles, type UserWithRoles,
} from "@/hooks/useUserRoles";

/** O que cada papel pode fazer — texto mostrado ao lado da caixa. */
const ROLE_SCOPE: Record<string, string> = {
  admin: "Acesso total, incluindo permissões e auditoria",
  ceo: "Leitura total, aprova compras e vê todo o financeiro",
  comercial: "Leads, clientes, cotações e estimates",
  compras: "RFQs, fornecedores, POs e certificados",
  financeiro: "Invoices, pagamentos e despesas",
  logistica: "Embarques, rastreio e aprovação de certificados",
  operador: "Leitura geral e edição dos próprios leads",
};

export function UserAccessDialog({
  user, open, onOpenChange, isSelf, adminCount,
}: {
  user: UserWithRoles | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isSelf: boolean;
  adminCount: number;
}) {
  const setRoles = useSetUserRoles();
  const saveProfile = useSaveProfile();

  const [roles, setRolesState] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");

  useEffect(() => {
    if (open && user) {
      setRolesState([...user.roles]);
      setName(user.full_name ?? "");
      setDept(user.department ?? "");
    }
  }, [open, user]);

  if (!user) return null;

  const toggle = (role: string) =>
    setRolesState((p) => (p.includes(role) ? p.filter((r) => r !== role) : [...p, role]));

  // Último admin do sistema não pode perder o papel — a trava também existe no banco.
  const lastAdmin = user.roles.includes("admin") && adminCount <= 1;
  const removingOwnAdmin = isSelf && user.roles.includes("admin") && !roles.includes("admin");

  const dirty =
    name !== (user.full_name ?? "") ||
    dept !== (user.department ?? "") ||
    roles.length !== user.roles.length ||
    roles.some((r) => !user.roles.includes(r));

  const save = async () => {
    if (name !== (user.full_name ?? "") || dept !== (user.department ?? "")) {
      await saveProfile.mutateAsync({
        id: user.id,
        full_name: name.trim() || null,
        department: dept.trim() || null,
      });
    }
    const changed =
      roles.length !== user.roles.length || roles.some((r) => !user.roles.includes(r));
    if (changed) {
      await setRoles.mutateAsync({ userId: user.id, roles });
    }
    onOpenChange(false);
  };

  const saving = setRoles.isPending || saveProfile.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <ShieldCheck className="h-5 w-5 text-gold" />
            Acesso de {user.full_name ?? user.email}
          </DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Nome completo
            </Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Departamento
            </Label>
            <Input value={dept} onChange={(e) => setDept(e.target.value)} placeholder="Comercial, Compras..." />
          </div>
        </div>

        <div>
          <Label className="mb-2 block text-xs font-medium text-muted-foreground">
            Permissões
          </Label>
          <div className="space-y-1.5">
            {ROLE_RANK.map((role) => {
              const checked = roles.includes(role);
              const blocked = role === "admin" && lastAdmin && checked;
              return (
                <label
                  key={role}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                    checked ? "border-primary/40 bg-primary/[0.04]" : "hover:bg-muted/40",
                    blocked && "cursor-not-allowed opacity-60",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    disabled={blocked}
                    onCheckedChange={() => !blocked && toggle(role)}
                    className="mt-0.5"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {roleLabels[role]}
                      {role === "admin" && (
                        <span className="ml-2 rounded-full bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-foreground">
                          acesso total
                        </span>
                      )}
                    </span>
                    <span className="block text-xs leading-relaxed text-muted-foreground">
                      {ROLE_SCOPE[role]}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {roles.length === 0 && (
          <p className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/15 px-3 py-2 text-xs text-warning-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Sem nenhum papel, a pessoa entra no sistema mas não consegue ler nem gravar quase nada.
          </p>
        )}
        {lastAdmin && (
          <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Este é o único administrador do sistema. Conceda o papel a outra pessoa antes de removê-lo daqui.
          </p>
        )}
        {removingOwnAdmin && !lastAdmin && (
          <p className="flex items-start gap-2 rounded-lg border border-aog/30 bg-aog/10 px-3 py-2 text-xs text-aog">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Você está removendo o próprio acesso de administrador. Depois de salvar, não conseguirá
            voltar a esta tela sozinho.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !dirty}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
