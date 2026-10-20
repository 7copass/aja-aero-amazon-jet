-- AJA Aero ERP — RLS por papel, substituindo o "Authenticated full access".
-- Leitura ampla para o escritório; escrita restrita ao papel dono do módulo;
-- valores financeiros visíveis só a quem cuida de dinheiro; DELETE revogado (arquivar).

CREATE SCHEMA IF NOT EXISTS app;
GRANT USAGE ON SCHEMA app TO authenticated;

CREATE OR REPLACE FUNCTION app.has_any_role(_roles public.app_role[])
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = ANY(_roles)
  );
$fn$;

CREATE OR REPLACE FUNCTION app.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $fn$ SELECT app.has_any_role(ARRAY['admin']::public.app_role[]); $fn$;

CREATE OR REPLACE FUNCTION app.sees_money()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $fn$ SELECT app.has_any_role(ARRAY['admin','ceo','financeiro']::public.app_role[]); $fn$;

GRANT EXECUTE ON FUNCTION app.has_any_role(public.app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION app.is_admin()  TO authenticated;
GRANT EXECUTE ON FUNCTION app.sees_money() TO authenticated;

-- ─────────── Remove as policies abertas da migration original ───────────
DO $do$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers','aircraft','parts','suppliers','leads','quotes','quote_items','rfqs',
    'rfq_items','supplier_quotes','certificates','estimates','invoices','purchase_orders',
    'purchase_order_items','logistics','payments','expenses','ai_agents','automations',
    'activity_logs','settings'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated full access" ON public.%I', t);
    EXECUTE format('REVOKE DELETE ON public.%I FROM authenticated', t);
  END LOOP;
END $do$;

-- ─────────── Gerador de policies por papel ───────────
-- _read: NULL = qualquer autenticado lê. _write: papéis que podem INSERT/UPDATE.
CREATE OR REPLACE FUNCTION app.build_policies(
  _table text, _write public.app_role[], _read public.app_role[] DEFAULT NULL
) RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE
  _read_expr  text := CASE WHEN _read IS NULL THEN 'true'
                      ELSE format('app.has_any_role(%L::public.app_role[])', _read) END;
  _write_expr text := format('app.has_any_role(%L::public.app_role[])', _write);
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', _table || '_select', _table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', _table || '_insert', _table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', _table || '_update', _table);

  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (%s)',
    _table || '_select', _table, _read_expr);
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)',
    _table || '_insert', _table, _write_expr);
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)',
    _table || '_update', _table, _write_expr, _write_expr);
END;
$fn$;

-- ─────────── A matriz ───────────
SELECT app.build_policies('customers',   ARRAY['admin','ceo','comercial']::public.app_role[]);
SELECT app.build_policies('aircraft',    ARRAY['admin','ceo','comercial']::public.app_role[]);
SELECT app.build_policies('leads',       ARRAY['admin','ceo','comercial','operador']::public.app_role[]);
SELECT app.build_policies('quotes',      ARRAY['admin','ceo','comercial']::public.app_role[]);
SELECT app.build_policies('quote_items', ARRAY['admin','ceo','comercial']::public.app_role[]);

SELECT app.build_policies('parts',           ARRAY['admin','ceo','comercial','compras']::public.app_role[]);
SELECT app.build_policies('suppliers',       ARRAY['admin','ceo','compras']::public.app_role[]);
SELECT app.build_policies('rfqs',            ARRAY['admin','ceo','compras']::public.app_role[]);
SELECT app.build_policies('rfq_items',       ARRAY['admin','ceo','compras']::public.app_role[]);
SELECT app.build_policies('supplier_quotes', ARRAY['admin','ceo','compras']::public.app_role[]);
SELECT app.build_policies('purchase_orders',      ARRAY['admin','ceo','compras']::public.app_role[]);
SELECT app.build_policies('purchase_order_items', ARRAY['admin','ceo','compras']::public.app_role[]);

SELECT app.build_policies('certificates', ARRAY['admin','ceo','compras','logistica']::public.app_role[]);
SELECT app.build_policies('logistics',    ARRAY['admin','ceo','logistica']::public.app_role[]);

SELECT app.build_policies('estimates', ARRAY['admin','ceo','financeiro','comercial']::public.app_role[]);
SELECT app.build_policies('invoices',  ARRAY['admin','ceo','financeiro']::public.app_role[]);

-- Dinheiro em caixa: leitura restrita
SELECT app.build_policies('payments', ARRAY['admin','ceo','financeiro']::public.app_role[],
                                      ARRAY['admin','ceo','financeiro']::public.app_role[]);
SELECT app.build_policies('expenses', ARRAY['admin','ceo','financeiro']::public.app_role[],
                                      ARRAY['admin','ceo','financeiro']::public.app_role[]);

-- Configuração e agentes
SELECT app.build_policies('settings',  ARRAY['admin','ceo']::public.app_role[]);
SELECT app.build_policies('ai_agents', ARRAY['admin','ceo']::public.app_role[]);

-- ─────────── Casos especiais ───────────
-- automations: log de execução, qualquer autenticado registra e lê
DROP POLICY IF EXISTS automations_select ON public.automations;
DROP POLICY IF EXISTS automations_insert ON public.automations;
CREATE POLICY automations_select ON public.automations FOR SELECT TO authenticated USING (true);
CREATE POLICY automations_insert ON public.automations FOR INSERT TO authenticated WITH CHECK (true);

-- activity_logs: todos escrevem (logActivity), só admin e ceo leem
DROP POLICY IF EXISTS activity_logs_select ON public.activity_logs;
DROP POLICY IF EXISTS activity_logs_insert ON public.activity_logs;
CREATE POLICY activity_logs_select ON public.activity_logs FOR SELECT TO authenticated
  USING (app.has_any_role(ARRAY['admin','ceo']::public.app_role[]));
CREATE POLICY activity_logs_insert ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (true);
