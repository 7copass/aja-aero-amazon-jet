
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','ceo','comercial','compras','financeiro','logistica','operador');
CREATE TYPE public.lead_status AS ENUM ('novo','qualificado','aguardando_cotacao','em_cotacao','estimate_enviado','follow_up','ganhou','perdido');
CREATE TYPE public.urgencia AS ENUM ('aog','normal');
CREATE TYPE public.customer_type AS ENUM ('oficina','operador','taxi_aereo','mecanico','proprietario','empresa');
CREATE TYPE public.quote_status AS ENUM ('nova','em_pesquisa','aguardando_fornecedor','preco_recebido','analise_margem','estimate_enviado','follow_up','aprovado','perdido','cancelado');
CREATE TYPE public.rfq_status AS ENUM ('rascunho','enviado','respondido','escolhido','recusado');
CREATE TYPE public.cert_type AS ENUM ('faa_8130_3','easa_form_1','coc','mfg_cert','tag','trace','non_incident');
CREATE TYPE public.cert_status AS ENUM ('pendente','recebido','aprovado','rejeitado');
CREATE TYPE public.po_status AS ENUM ('aguardando_aprovacao','po_criada','aguardando_pagamento','pedido_realizado','aguardando_envio','enviado_fornecedor','recebido','em_conferencia','liberado_logistica');
CREATE TYPE public.logistics_status AS ENUM ('aguardando_peca','em_transito_deerfield','recebido_deerfield','conferencia','doc_pendente','pronto_exportacao','enviado_brasil','em_nacionalizacao','entregue');
CREATE TYPE public.fin_doc_status AS ENUM ('rascunho','enviado','aprovado','pago','cancelado');
CREATE TYPE public.payment_type AS ENUM ('recebido','enviado');

-- UPDATED_AT helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  department TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- NEW USER TRIGGER (profile + default operador role; first user becomes admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE first_user BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO first_user;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN first_user THEN 'admin'::public.app_role ELSE 'operador'::public.app_role END);
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generic authenticated full-access policy helper applied per table below.

-- CUSTOMERS
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  tax_id TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  country TEXT DEFAULT 'Brasil',
  state TEXT,
  city TEXT,
  address TEXT,
  type public.customer_type,
  aircraft_operated TEXT,
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AIRCRAFT
CREATE TABLE public.aircraft (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  registration TEXT,
  model TEXT,
  manufacturer TEXT,
  serial_number TEXT,
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PARTS
CREATE TABLE public.parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pn TEXT NOT NULL,
  description TEXT,
  manufacturer TEXT,
  application TEXT,
  compatible_aircraft TEXT,
  ata_chapter TEXT,
  conditions_available TEXT,
  alternate_pn TEXT,
  superseded_pn TEXT,
  estimated_weight NUMERIC,
  dimensions TEXT,
  required_certification TEXT,
  last_price NUMERIC,
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SUPPLIERS
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website TEXT,
  login TEXT,
  password_encrypted TEXT,
  contact TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  part_type TEXT,
  manufacturers_served TEXT,
  conditions_offered TEXT,
  avg_lead_time TEXT,
  certifications TEXT,
  internal_rating INT,
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- LEADS
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  whatsapp TEXT,
  email TEXT,
  source TEXT,
  aircraft TEXT,
  pn_requested TEXT,
  quantity INT,
  desired_condition TEXT,
  urgency public.urgencia NOT NULL DEFAULT 'normal',
  status public.lead_status NOT NULL DEFAULT 'novo',
  responsible TEXT,
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- QUOTES
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_number TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  responsible TEXT,
  quote_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  is_aog BOOLEAN NOT NULL DEFAULT false,
  aircraft TEXT,
  suppliers_consulted TEXT,
  supplier_cost NUMERIC DEFAULT 0,
  freight NUMERIC DEFAULT 0,
  import_fee NUMERIC DEFAULT 0,
  exchange_rate NUMERIC DEFAULT 5.0,
  desired_margin NUMERIC DEFAULT 25,
  final_price NUMERIC DEFAULT 0,
  real_margin NUMERIC DEFAULT 0,
  status public.quote_status NOT NULL DEFAULT 'nova',
  last_followup TIMESTAMPTZ,
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- QUOTE ITEMS
CREATE TABLE public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.parts(id) ON DELETE SET NULL,
  pn TEXT,
  description TEXT,
  quantity INT DEFAULT 1,
  condition TEXT,
  unit_cost NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RFQS
CREATE TABLE public.rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_number TEXT NOT NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_email TEXT,
  status public.rfq_status NOT NULL DEFAULT 'rascunho',
  sent_date DATE,
  response_date DATE,
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RFQ ITEMS
CREATE TABLE public.rfq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.parts(id) ON DELETE SET NULL,
  pn TEXT,
  description TEXT,
  quantity INT DEFAULT 1,
  condition_requested TEXT,
  price_received NUMERIC,
  lead_time TEXT,
  certification TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SUPPLIER QUOTES (responses)
CREATE TABLE public.supplier_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID REFERENCES public.rfqs(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  pn TEXT,
  price NUMERIC,
  lead_time TEXT,
  condition TEXT,
  certification TEXT,
  chosen BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CERTIFICATES
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID REFERENCES public.parts(id) ON DELETE SET NULL,
  pn TEXT,
  serial_number TEXT,
  cert_type public.cert_type,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  file_url TEXT,
  issue_date DATE,
  valid_until DATE,
  status public.cert_status NOT NULL DEFAULT 'pendente',
  required BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ESTIMATES
CREATE TABLE public.estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_number TEXT NOT NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  total NUMERIC DEFAULT 0,
  status public.fin_doc_status NOT NULL DEFAULT 'rascunho',
  valid_until DATE,
  terms TEXT,
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INVOICES
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  estimate_id UUID REFERENCES public.estimates(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  total NUMERIC DEFAULT 0,
  status public.fin_doc_status NOT NULL DEFAULT 'rascunho',
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  terms TEXT,
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PURCHASE ORDERS
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  total NUMERIC DEFAULT 0,
  purchase_date DATE,
  payment_method TEXT,
  status public.po_status NOT NULL DEFAULT 'aguardando_aprovacao',
  tracking TEXT,
  certificate_received BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PO ITEMS
CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.parts(id) ON DELETE SET NULL,
  pn TEXT,
  description TEXT,
  quantity INT DEFAULT 1,
  condition TEXT,
  unit_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- LOGISTICS
CREATE TABLE public.logistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  pn TEXT,
  supplier_tracking TEXT,
  carrier TEXT,
  weight NUMERIC,
  dimensions TEXT,
  packing_list TEXT,
  commercial_invoice TEXT,
  destination_address TEXT,
  status public.logistics_status NOT NULL DEFAULT 'aguardando_peca',
  expected_date DATE,
  delivered_date DATE,
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PAYMENTS
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  po_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  type public.payment_type NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_date DATE DEFAULT CURRENT_DATE,
  method TEXT,
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- EXPENSES
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  category TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  expense_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI AGENTS
CREATE TABLE public.ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  agent_key TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  last_run TIMESTAMPTZ,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AUTOMATIONS (run log)
CREATE TABLE public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key TEXT,
  title TEXT,
  result TEXT,
  status TEXT DEFAULT 'ok',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ACTIVITY LOGS
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_name TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SETTINGS (single config row, key-value)
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GRANTS + RLS + POLICIES + updated_at triggers for all operational tables
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers','aircraft','parts','suppliers','leads','quotes','quote_items','rfqs','rfq_items',
    'supplier_quotes','certificates','estimates','invoices','purchase_orders','purchase_order_items',
    'logistics','payments','expenses','ai_agents','automations','activity_logs','settings'
  ] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE POLICY "Authenticated full access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY[
    'customers','aircraft','parts','suppliers','leads','quotes','rfqs','certificates',
    'estimates','invoices','purchase_orders','logistics','ai_agents'
  ] LOOP
    EXECUTE format('CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t, t);
  END LOOP;
END $$;
