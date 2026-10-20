import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { describeDbError, logActivity } from "@/lib/db";
import { toast } from "sonner";

/** Da maior para a menor autoridade — define qual papel representa o usuário. */
export const ROLE_RANK = [
  "admin", "ceo", "financeiro", "compras", "logistica", "comercial", "operador",
] as const;

export type AppRole = (typeof ROLE_RANK)[number];

export function highestRole(roles: string[] | undefined): string | undefined {
  if (!roles?.length) return undefined;
  return ROLE_RANK.find((r) => roles.includes(r)) ?? roles[0];
}

export interface UserWithRoles {
  id: string;
  email: string | null;
  full_name: string | null;
  department: string | null;
  created_at: string;
  roles: string[];
}

/** Perfis com seus papéis. Só admin enxerga papéis de terceiros (RLS). */
export function useUsersWithRoles() {
  return useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async (): Promise<UserWithRoles[]> => {
      const [{ data: profiles, error: pe }, { data: roles, error: re }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: true }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pe) throw pe;
      if (re) throw re;

      const byUser = new Map<string, string[]>();
      (roles ?? []).forEach((r: any) => {
        const list = byUser.get(r.user_id) ?? [];
        list.push(r.role);
        byUser.set(r.user_id, list);
      });

      return (profiles ?? []).map((p: any) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        department: p.department,
        created_at: p.created_at,
        roles: byUser.get(p.id) ?? [],
      }));
    },
  });
}

/** Substitui os papéis de um usuário pelo conjunto informado. */
export function useSetUserRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: string[] }) => {
      const { data: current, error: ce } = await supabase
        .from("user_roles").select("role").eq("user_id", userId);
      if (ce) throw ce;

      const have = new Set((current ?? []).map((r: any) => r.role));
      const want = new Set(roles);

      const toAdd = [...want].filter((r) => !have.has(r));
      const toDrop = [...have].filter((r) => !want.has(r));

      if (toAdd.length) {
        const { error } = await supabase
          .from("user_roles")
          .insert(toAdd.map((role) => ({ user_id: userId, role: role as any })));
        if (error) throw error;
      }
      if (toDrop.length) {
        const { data, error } = await supabase
          .from("user_roles").delete()
          .eq("user_id", userId).in("role", toDrop as any)
          .select("id");
        if (error) throw error;
        // RLS barrada não gera erro: simplesmente não casa linha.
        if (!data || data.length === 0) {
          throw Object.assign(new Error("sem permissão"), { code: "42501" });
        }
      }
      return { added: toAdd, removed: toDrop };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["users-with-roles"] });
      qc.invalidateQueries({ queryKey: ["current-user"] });
      logActivity("user_roles", `papéis atualizados (+${r.added.length} / -${r.removed.length})`);
      toast.success("Permissões atualizadas");
    },
    onError: (e: any) => toast.error(describeDbError(e)),
  });
}

/** Nome e departamento do perfil. */
export function useSaveProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, full_name, department }:
      { id: string; full_name: string | null; department: string | null }) => {
      const { data, error } = await supabase
        .from("profiles").update({ full_name, department }).eq("id", id).select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw Object.assign(new Error("sem permissão"), { code: "42501" });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users-with-roles"] });
      qc.invalidateQueries({ queryKey: ["current-user"] });
      toast.success("Perfil salvo");
    },
    onError: (e: any) => toast.error(describeDbError(e)),
  });
}
