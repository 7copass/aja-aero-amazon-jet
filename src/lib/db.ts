import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TableName =
  | "customers" | "leads" | "aircraft" | "parts" | "suppliers" | "rfqs" | "rfq_items"
  | "quotes" | "quote_items" | "supplier_quotes" | "certificates" | "estimates"
  | "invoices" | "purchase_orders" | "purchase_order_items" | "logistics" | "payments"
  | "expenses" | "ai_agents" | "automations" | "activity_logs" | "settings" | "profiles";

/** Traduz erro do Postgres/PostgREST para algo que o usuário entenda. */
export function describeDbError(e: any): string {
  const code = e?.code ?? "";
  const msg = String(e?.message ?? "");

  if (code === "42501" || /row-level security/i.test(msg)) {
    return "Seu perfil não tem permissão para esta ação.";
  }
  if (code === "23505" || /duplicate key/i.test(msg)) {
    if (/internal_number|rfq_number|po_number|invoice_number|estimate_number/.test(msg)) {
      return "Já existe um documento com esse número. Use outro.";
    }
    if (/parts_pn|uq_parts_pn/.test(msg)) return "Esse PN já está cadastrado.";
    if (/registration/.test(msg)) return "Essa matrícula de aeronave já existe.";
    return "Esse registro já existe.";
  }
  if (code === "23503") return "Registro relacionado não encontrado ou já removido.";
  if (code === "23514") return "Valor inválido para um dos campos.";
  if (code === "23502") return "Preencha todos os campos obrigatórios.";
  if (code === "PGRST116" || code === "PGRST204") {
    return "Nada foi alterado — você pode não ter permissão sobre este registro.";
  }
  return msg || "Erro inesperado.";
}

/** Erro lançado quando a RLS silenciosamente não casa nenhuma linha. */
class PermissionError extends Error {
  code = "42501";
  constructor() {
    super("Seu perfil não tem permissão para esta ação.");
  }
}

export function useRows<T = any>(
  table: TableName,
  opts: { select?: string; order?: string; ascending?: boolean; includeArchived?: boolean } = {},
) {
  const { select = "*", order = "created_at", ascending = false, includeArchived = false } = opts;
  return useQuery({
    queryKey: [table, opts],
    queryFn: async (): Promise<T[]> => {
      const { data, error } = await supabase
        .from(table as any)
        .select(select)
        .order(order, { ascending });
      if (error) throw error;
      let rows = (data ?? []) as any[];
      if (!includeArchived) rows = rows.filter((r) => !("archived" in r) || !r.archived);
      return rows as T[];
    },
  });
}

export function useSaveRow(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: any) => {
      const { id, ...rest } = row;
      if (id) {
        // .select() devolve as linhas afetadas: vazio = a policy de UPDATE barrou.
        const { data, error } = await supabase
          .from(table as any)
          .update(rest)
          .eq("id", id)
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) throw new PermissionError();
      } else {
        const { data, error } = await supabase
          .from(table as any)
          .insert(rest)
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) throw new PermissionError();
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
      logActivity(table, "salvou registro");
      toast.success("Salvo com sucesso");
    },
    onError: (e: any) => toast.error(describeDbError(e)),
  });
}

export function useArchiveRow(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from(table as any)
        .update({ archived: true })
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new PermissionError();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
      logActivity(table, "arquivou registro");
      toast.success("Registro arquivado");
    },
    onError: (e: any) => toast.error(describeDbError(e)),
  });
}

export function useUpdateStatus(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from(table as any)
        .update({ status })
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new PermissionError();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
    onError: (e: any) => toast.error(describeDbError(e)),
  });
}

/** Próximo número de documento, gerado atomicamente pelo banco. */
export async function nextDocumentNumber(
  docType: "quote" | "rfq" | "po" | "estimate" | "invoice",
): Promise<string | null> {
  const { data, error } = await supabase.rpc("next_document_number" as any, {
    _doc_type: docType,
  });
  if (error) return null;
  return (data as string) ?? null;
}

export async function logActivity(entity: string, action: string, details?: string) {
  try {
    const { data } = await supabase.auth.getUser();
    await supabase.from("activity_logs").insert({
      user_id: data.user?.id ?? null,
      user_name: data.user?.email ?? "Sistema",
      action,
      entity,
      details: details ?? null,
    });
  } catch {
    /* silent */
  }
}
