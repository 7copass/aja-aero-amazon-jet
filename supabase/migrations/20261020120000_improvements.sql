-- AJA Aero ERP — melhorias compatíveis com o app existente.
-- Nada aqui muda nome de coluna ou tipo usado pelas telas; só adiciona garantias.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─────────── 1. Numeração atômica de documentos ───────────
CREATE TABLE IF NOT EXISTS public.document_counters (
  doc_type    text NOT NULL,
  year        int  NOT NULL,
  last_number int  NOT NULL DEFAULT 0,
  PRIMARY KEY (doc_type, year)
);
ALTER TABLE public.document_counters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.document_counters FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.next_document_number(_doc_type text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  _year   int := EXTRACT(YEAR FROM now())::int;
  _n      int;
  _prefix text := CASE _doc_type
    WHEN 'quote'    THEN 'COT'
    WHEN 'rfq'      THEN 'RFQ'
    WHEN 'po'       THEN 'PO'
    WHEN 'estimate' THEN 'EST'
    WHEN 'invoice'  THEN 'INV'
    ELSE 'DOC'
  END;
BEGIN
  INSERT INTO public.document_counters (doc_type, year, last_number)
  VALUES (_doc_type, _year, 1)
  ON CONFLICT (doc_type, year)
  DO UPDATE SET last_number = public.document_counters.last_number + 1
  RETURNING last_number INTO _n;

  RETURN format('%s-%s-%s', _prefix, _year, lpad(_n::text, 4, '0'));
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.next_document_number(text) TO authenticated;

-- ─────────── 2. Unicidade dos números de documento ───────────
CREATE UNIQUE INDEX IF NOT EXISTS uq_quotes_internal_number     ON public.quotes (internal_number);
CREATE UNIQUE INDEX IF NOT EXISTS uq_rfqs_number                ON public.rfqs (rfq_number);
CREATE UNIQUE INDEX IF NOT EXISTS uq_po_number                  ON public.purchase_orders (po_number);
CREATE UNIQUE INDEX IF NOT EXISTS uq_estimates_number           ON public.estimates (estimate_number);
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_number            ON public.invoices (invoice_number);
CREATE UNIQUE INDEX IF NOT EXISTS uq_parts_pn                   ON public.parts (pn);
CREATE UNIQUE INDEX IF NOT EXISTS uq_aircraft_registration      ON public.aircraft (registration) WHERE registration IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_agents_key              ON public.ai_agents (agent_key);

-- ─────────── 3. Autoria automática ───────────
DO $do$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers','aircraft','parts','suppliers','leads','quotes','rfqs','certificates',
    'estimates','invoices','purchase_orders','logistics','payments','expenses'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS created_by uuid', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS updated_by uuid', t);
  END LOOP;
END $do$;

CREATE OR REPLACE FUNCTION public.set_actor()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
  END IF;
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$fn$;

DO $do$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers','aircraft','parts','suppliers','leads','quotes','rfqs','certificates',
    'estimates','invoices','purchase_orders','logistics','payments','expenses'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_actor ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_actor BEFORE INSERT OR UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_actor()', t, t);
  END LOOP;
END $do$;

-- ─────────── 4. Índices que sustentam as telas ───────────
CREATE INDEX IF NOT EXISTS idx_quotes_status      ON public.quotes (status)         WHERE NOT archived;
CREATE INDEX IF NOT EXISTS idx_quotes_aog         ON public.quotes (status)         WHERE is_aog AND NOT archived;
CREATE INDEX IF NOT EXISTS idx_quotes_customer    ON public.quotes (customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_status       ON public.leads (status, urgency) WHERE NOT archived;
CREATE INDEX IF NOT EXISTS idx_parts_pn_trgm      ON public.parts USING gin (pn gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON public.customers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_invoices_due       ON public.invoices (due_date)     WHERE status NOT IN ('pago','cancelado');
CREATE INDEX IF NOT EXISTS idx_certs_pending      ON public.certificates (status)   WHERE required AND status <> 'aprovado';
CREATE INDEX IF NOT EXISTS idx_logistics_open     ON public.logistics (status, expected_date) WHERE status <> 'entregue';
CREATE INDEX IF NOT EXISTS idx_po_status          ON public.purchase_orders (status) WHERE NOT archived;
CREATE INDEX IF NOT EXISTS idx_rfqs_quote         ON public.rfqs (quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote  ON public.quote_items (quote_id);
CREATE INDEX IF NOT EXISTS idx_rfq_items_rfq      ON public.rfq_items (rfq_id);
CREATE INDEX IF NOT EXISTS idx_po_items_po        ON public.purchase_order_items (po_id);
CREATE INDEX IF NOT EXISTS idx_activity_created   ON public.activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_invoice   ON public.payments (invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_po        ON public.payments (po_id);

-- ─────────── 5. Auditoria à prova de front ───────────
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE IF NOT EXISTS audit.record_versions (
  id             bigserial PRIMARY KEY,
  table_name     text NOT NULL,
  record_id      uuid,
  op             text NOT NULL,
  old_data       jsonb,
  new_data       jsonb,
  changed_fields text[],
  actor_id       uuid,
  actor_email    text,
  at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_record ON audit.record_versions (table_name, record_id, at DESC);
ALTER TABLE audit.record_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON audit.record_versions FROM authenticated, anon;

CREATE OR REPLACE FUNCTION audit.track_changes()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, audit
AS $fn$
DECLARE
  _old jsonb := CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END;
  _new jsonb := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END;
  _changed text[];
BEGIN
  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(e.key) INTO _changed
    FROM jsonb_each(_new) e
    WHERE e.value IS DISTINCT FROM _old -> e.key
      AND e.key NOT IN ('updated_at', 'updated_by');

    IF _changed IS NULL THEN
      RETURN NULL;
    END IF;
  END IF;

  INSERT INTO audit.record_versions (
    table_name, record_id, op, old_data, new_data,
    changed_fields, actor_id, actor_email
  )
  VALUES (
    TG_TABLE_NAME,
    COALESCE((_new ->> 'id')::uuid, (_old ->> 'id')::uuid),
    TG_OP, _old, _new, _changed,
    auth.uid(), auth.jwt() ->> 'email'
  );

  RETURN NULL;
END;
$fn$;

DO $do$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers','aircraft','parts','suppliers','leads','quotes','quote_items','rfqs',
    'rfq_items','supplier_quotes','certificates','estimates','invoices',
    'purchase_orders','purchase_order_items','logistics','payments','expenses',
    'user_roles','settings'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_audit ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION audit.track_changes()', t, t);
  END LOOP;
END $do$;
