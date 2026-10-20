// AJA Aero ERP — Arquitetura de banco de dados (documentação viva).
// Este módulo descreve o desenho-alvo do Postgres/Supabase: camadas, tabelas,
// RLS, RPCs, triggers, edge functions e o plano de migrations.
// Nada aqui executa SQL — é a especificação que guia as migrations reais.

export type Maturity = "existente" | "revisada" | "nova";

export interface ColumnDoc {
  name: string;
  type: string;
  key?: "pk" | "fk" | "uk" | "idx";
  note?: string;
}

export interface TableDoc {
  name: string;
  schema?: string;
  layer: LayerId;
  maturity: Maturity;
  purpose: string;
  columns: ColumnDoc[];
  relations?: string[];
  indexes?: string[];
  rls: string;
  notes?: string[];
}

export type LayerId =
  | "fundacao" | "identidade" | "cadastros" | "comercial"
  | "documentos" | "operacao" | "financeiro" | "automacao" | "auditoria";

export interface LayerDoc {
  id: LayerId;
  name: string;
  tagline: string;
  description: string;
}

export const layers: LayerDoc[] = [
  {
    id: "fundacao",
    name: "Fundação",
    tagline: "Convenções, contadores e máquina de estados",
    description:
      "Extensões, schemas auxiliares (app e audit), helpers de updated_at/created_by, numeração atômica de documentos e a tabela que define quais transições de status são legais. Tudo o mais depende desta camada.",
  },
  {
    id: "identidade",
    name: "Identidade & Acesso",
    tagline: "Quem é quem e o que cada um pode fazer",
    description:
      "Perfis espelhados de auth.users, papéis (7 níveis) e as funções SECURITY DEFINER que toda policy de RLS consulta. É aqui que o sistema deixa de ser 'todo autenticado vê tudo'.",
  },
  {
    id: "cadastros",
    name: "Cadastros",
    tagline: "Clientes, aeronaves, peças e fornecedores",
    description:
      "As entidades estáveis do negócio. Mudam pouco, são referenciadas por todo o resto. Inclui a separação das credenciais de fornecedor para fora da tabela principal.",
  },
  {
    id: "comercial",
    name: "Comercial",
    tagline: "Do lead ao preço fechado",
    description:
      "O pipeline: lead → cotação → RFQ → respostas dos fornecedores → escolha → precificação. É a camada com mais regra de negócio e onde os itens de linha passam a existir de verdade.",
  },
  {
    id: "documentos",
    name: "Documentos",
    tagline: "Estimate, Invoice, PO e certificados",
    description:
      "Os artefatos formais. Numeração controlada, itens de linha próprios, e o portão de certificação que impede uma PO de avançar sem FAA 8130-3 / EASA Form 1 aprovado.",
  },
  {
    id: "operacao",
    name: "Operação",
    tagline: "Deerfield → Brasil, evento a evento",
    description:
      "Logística com histórico imutável de eventos em vez de um único campo status, e controle de estoque em nível de serial para peças que ficam no hub.",
  },
  {
    id: "financeiro",
    name: "Financeiro",
    tagline: "Recebimentos, pagamentos, despesas e câmbio",
    description:
      "Tudo em USD como moeda funcional, com tabela de câmbio datada para conversão a BRL — hoje exchange_rate é gravado e nunca usado.",
  },
  {
    id: "automacao",
    name: "Automação & IA",
    tagline: "Agentes, execuções e notificações",
    description:
      "Registro dos agentes, histórico auditável de cada execução (entrada, saída, custo, tokens) e a fila de notificações que alimenta alertas de AOG e atraso.",
  },
  {
    id: "auditoria",
    name: "Auditoria",
    tagline: "Trilha que não depende da aplicação",
    description:
      "Versionamento genérico por trigger: toda alteração vira uma linha com diff em JSONB e o autor real vindo do JWT. O activity_logs atual é escrito pelo front e pode simplesmente não ser chamado.",
  },
];

export const tables: TableDoc[] = [
  // ───────────────────────── FUNDAÇÃO ─────────────────────────
  {
    name: "document_counters",
    layer: "fundacao",
    maturity: "nova",
    purpose:
      "Contador atômico por tipo de documento e ano. Hoje o número interno (COT-2026-00XX) é digitado à mão pelo usuário, sem unicidade — dois comerciais criam a mesma cotação.",
    columns: [
      { name: "doc_type", type: "text", key: "pk", note: "quote | rfq | po | estimate | invoice" },
      { name: "year", type: "int", key: "pk" },
      { name: "last_number", type: "int", note: "NOT NULL DEFAULT 0" },
    ],
    rls: "Sem acesso direto. Só a RPC next_document_number (SECURITY DEFINER) escreve aqui.",
    notes: [
      "Incremento via INSERT … ON CONFLICT DO UPDATE RETURNING — atômico sob concorrência, sem SELECT-then-UPDATE.",
      "Sequence nativa não serve porque o contador reinicia a cada ano e é por tipo.",
    ],
  },
  {
    name: "status_transitions",
    layer: "fundacao",
    maturity: "nova",
    purpose:
      "Máquina de estados declarativa. Define quais mudanças de status são válidas por entidade e quais papéis podem executá-las. Hoje qualquer um arrasta um card do Kanban de 'nova' direto para 'aprovado'.",
    columns: [
      { name: "entity", type: "text", key: "pk", note: "quote | rfq | po | logistics | certificate | invoice" },
      { name: "from_status", type: "text", key: "pk" },
      { name: "to_status", type: "text", key: "pk" },
      { name: "allowed_roles", type: "app_role[]", note: "DEFAULT '{admin,ceo}'" },
      { name: "requires_reason", type: "boolean", note: "obriga justificativa (ex.: marcar como perdido)" },
    ],
    rls: "SELECT: todos. INSERT/UPDATE/DELETE: apenas admin.",
    notes: [
      "Dado, não código: a regra vira uma tela editável em Configurações sem precisar de migration.",
      "Consultada pelo trigger enforce_status_transition antes de qualquer UPDATE de status.",
    ],
  },
  {
    name: "settings",
    layer: "fundacao",
    maturity: "revisada",
    purpose:
      "Configuração chave-valor da empresa e do financeiro. A tela existe mas os campos são defaultValue — nada persiste.",
    columns: [
      { name: "key", type: "text", key: "uk", note: "company | finance | integrations | notifications" },
      { name: "value", type: "jsonb", note: "DEFAULT '{}'" },
      { name: "updated_by", type: "uuid", key: "fk", note: "→ profiles" },
      { name: "updated_at", type: "timestamptz" },
    ],
    rls: "SELECT: todos autenticados. UPDATE: admin e ceo.",
    notes: [
      "finance.min_margin (20%) e finance.default_exchange passam a ser lidos pelas RPCs de precificação — hoje 20% está hardcoded em cotacoes.tsx.",
      "CHECK que valida o formato do JSONB por chave via jsonb_matches_schema (extensão pg_jsonschema).",
    ],
  },

  // ─────────────────────── IDENTIDADE ───────────────────────
  {
    name: "profiles",
    layer: "identidade",
    maturity: "revisada",
    purpose: "Espelho de auth.users com dados de negócio. Criado pelo trigger handle_new_user.",
    columns: [
      { name: "id", type: "uuid", key: "pk", note: "→ auth.users ON DELETE CASCADE" },
      { name: "full_name", type: "text" },
      { name: "email", type: "text" },
      { name: "department", type: "text" },
      { name: "phone", type: "text", note: "novo — para notificações" },
      { name: "avatar_path", type: "text", note: "novo — bucket avatars" },
      { name: "locale", type: "text", note: "novo — pt | en | es, hoje só em localStorage" },
      { name: "last_seen_at", type: "timestamptz", note: "novo" },
      { name: "archived", type: "boolean" },
    ],
    relations: ["1:N user_roles", "1:N notifications"],
    rls: "SELECT: todos autenticados. UPDATE: o próprio dono, ou admin para qualquer um.",
  },
  {
    name: "user_roles",
    layer: "identidade",
    maturity: "existente",
    purpose:
      "Papel do usuário em tabela separada — nunca em profiles. Se o papel morasse no perfil que o próprio usuário edita, ele se promoveria a admin.",
    columns: [
      { name: "user_id", type: "uuid", key: "fk", note: "UNIQUE(user_id, role)" },
      { name: "role", type: "app_role", note: "admin ceo comercial compras financeiro logistica operador" },
      { name: "granted_by", type: "uuid", key: "fk", note: "novo — quem concedeu" },
      { name: "granted_at", type: "timestamptz", note: "novo" },
    ],
    rls: "SELECT: o próprio ou admin. ALL: apenas admin.",
    notes: [
      "Primeiro usuário cadastrado vira admin automaticamente (handle_new_user). Regra correta, mas hoje sem trava: vale adicionar allowlist de domínio de e-mail.",
    ],
  },
  {
    name: "user_invites",
    layer: "identidade",
    maturity: "nova",
    purpose:
      "Convite com papel pré-definido. Hoje qualquer pessoa que descubra a URL cria conta pela tela de signup e entra como operador com acesso total de leitura.",
    columns: [
      { name: "email", type: "citext", key: "uk" },
      { name: "role", type: "app_role" },
      { name: "token_hash", type: "text", note: "hash do token, nunca o token" },
      { name: "expires_at", type: "timestamptz", note: "DEFAULT now() + interval '7 days'" },
      { name: "accepted_at", type: "timestamptz" },
      { name: "invited_by", type: "uuid", key: "fk" },
    ],
    rls: "ALL: apenas admin. O consumo do convite acontece via RPC SECURITY DEFINER.",
  },

  // ─────────────────────── CADASTROS ───────────────────────
  {
    name: "customers",
    layer: "cadastros",
    maturity: "revisada",
    purpose: "Operadores, oficinas, táxis aéreos, mecânicos e proprietários.",
    columns: [
      { name: "name", type: "text", note: "NOT NULL" },
      { name: "company", type: "text" },
      { name: "tax_id", type: "text", note: "CNPJ/CPF ou EIN — UNIQUE parcial WHERE tax_id IS NOT NULL" },
      { name: "type", type: "customer_type" },
      { name: "country / state / city / address", type: "text" },
      { name: "phone / whatsapp / email", type: "text" },
      { name: "aircraft_operated", type: "text", note: "texto livre hoje; passa a ser derivado de aircraft" },
      { name: "credit_limit", type: "numeric(14,2)", note: "novo" },
      { name: "payment_terms_days", type: "int", note: "novo — alimenta due_date da invoice" },
      { name: "search_tsv", type: "tsvector", key: "idx", note: "novo — GENERATED, busca full-text" },
    ],
    relations: ["1:N aircraft", "1:N quotes", "1:N invoices"],
    indexes: ["GIN(search_tsv)", "btree(type) WHERE NOT archived"],
    rls: "SELECT: todos. INSERT/UPDATE: admin, ceo, comercial.",
  },
  {
    name: "customer_contacts",
    layer: "cadastros",
    maturity: "nova",
    purpose:
      "Uma oficina tem comprador, gerente técnico e financeiro — pessoas diferentes. Hoje cabe um único e-mail no cadastro.",
    columns: [
      { name: "customer_id", type: "uuid", key: "fk" },
      { name: "name / role / email / phone / whatsapp", type: "text" },
      { name: "is_primary", type: "boolean", note: "índice único parcial: um primário por cliente" },
    ],
    rls: "Herda a política de customers.",
  },
  {
    name: "aircraft",
    layer: "cadastros",
    maturity: "revisada",
    purpose:
      "Frota do cliente. A tabela já existe na migration atual e não tem uma única tela — o campo 'aeronave' em leads e cotações é texto livre, então a mesma aeronave aparece grafada de cinco jeitos.",
    columns: [
      { name: "customer_id", type: "uuid", key: "fk" },
      { name: "registration", type: "text", key: "uk", note: "matrícula, ex.: PR-XXX — UNIQUE" },
      { name: "model / manufacturer / serial_number", type: "text" },
      { name: "engine_model", type: "text", note: "novo" },
      { name: "total_hours", type: "numeric", note: "novo" },
    ],
    relations: ["N:1 customers", "1:N quotes (aircraft_id substitui o texto livre)"],
    rls: "SELECT: todos. INSERT/UPDATE: admin, ceo, comercial.",
  },
  {
    name: "parts",
    layer: "cadastros",
    maturity: "revisada",
    purpose: "Catálogo técnico de part numbers.",
    columns: [
      { name: "pn", type: "text", key: "uk", note: "UNIQUE — hoje sem unicidade, o mesmo PN entra duplicado" },
      { name: "description / manufacturer / application", type: "text" },
      { name: "ata_chapter", type: "text", note: "capítulo ATA 100" },
      { name: "conditions_available", type: "text", note: "NE OH SV AR RP — vira enum part_condition" },
      { name: "required_certification", type: "cert_type[]", note: "era texto livre" },
      { name: "estimated_weight / dimensions", type: "numeric / text" },
      { name: "last_price", type: "numeric", note: "passa a ser mantido por trigger vindo de supplier_quotes" },
      { name: "hazmat", type: "boolean", note: "novo — muda a logística e a documentação de exportação" },
      { name: "search_tsv", type: "tsvector", key: "idx", note: "novo" },
    ],
    indexes: ["GIN(pn gin_trgm_ops) — busca por PN parcial", "GIN(search_tsv)"],
    rls: "SELECT: todos. INSERT/UPDATE: admin, ceo, compras, comercial.",
  },
  {
    name: "part_alternates",
    layer: "cadastros",
    maturity: "nova",
    purpose:
      "Equivalências entre PNs. Hoje alternate_pn e superseded_pn são campos de texto no próprio registro — não dá para consultar 'que peças substituem esta'.",
    columns: [
      { name: "part_id", type: "uuid", key: "fk" },
      { name: "alternate_pn", type: "text" },
      { name: "kind", type: "text", note: "alternate | superseded_by | supersedes" },
      { name: "source", type: "text", note: "IPC, boletim de serviço, fornecedor" },
    ],
    rls: "Herda a política de parts.",
  },
  {
    name: "suppliers",
    layer: "cadastros",
    maturity: "revisada",
    purpose: "Rede global de suprimento.",
    columns: [
      { name: "name", type: "text", note: "NOT NULL" },
      { name: "website / country / part_type", type: "text" },
      { name: "manufacturers_served / conditions_offered", type: "text" },
      { name: "certifications", type: "cert_type[]", note: "era texto livre" },
      { name: "avg_lead_time_days", type: "int", note: "era texto ('3-5 dias') — impede ordenação" },
      { name: "internal_rating", type: "int", note: "CHECK entre 1 e 5" },
      { name: "on_time_rate", type: "numeric", note: "novo — calculado de logistics" },
      { name: "login / password_encrypted", type: "—", note: "REMOVIDOS — ver supplier_credentials" },
    ],
    rls: "SELECT: todos. INSERT/UPDATE: admin, ceo, compras.",
    notes: [
      "A tabela atual guarda login e password_encrypted em colunas legíveis por qualquer autenticado. Como a policy é USING(true), todo funcionário pode ler a senha de portal de todos os fornecedores.",
    ],
  },
  {
    name: "supplier_contacts",
    layer: "cadastros",
    maturity: "nova",
    purpose: "Contatos por fornecedor, com destinatário padrão de RFQ.",
    columns: [
      { name: "supplier_id", type: "uuid", key: "fk" },
      { name: "name / email / phone / timezone", type: "text" },
      { name: "receives_rfq", type: "boolean", note: "usado pela edge function send-rfq-email" },
    ],
    rls: "Herda a política de suppliers.",
  },
  {
    name: "supplier_credentials",
    layer: "cadastros",
    maturity: "nova",
    purpose:
      "Credenciais de portal isoladas em tabela própria, com RLS restrita a admin e o segredo guardado no Supabase Vault — a coluna só carrega o ponteiro.",
    columns: [
      { name: "supplier_id", type: "uuid", key: "pk" },
      { name: "login", type: "text" },
      { name: "secret_id", type: "uuid", note: "→ vault.secrets, nunca a senha em claro" },
      { name: "rotated_at / updated_by", type: "timestamptz / uuid" },
    ],
    rls: "ALL: apenas admin. Leitura do segredo só por RPC SECURITY DEFINER, e cada leitura vira linha de auditoria.",
  },

  // ─────────────────────── COMERCIAL ───────────────────────
  {
    name: "leads",
    layer: "comercial",
    maturity: "revisada",
    purpose: "Captação e qualificação. Origem típica: WhatsApp.",
    columns: [
      { name: "name / company / whatsapp / email", type: "text" },
      { name: "source", type: "text", note: "whatsapp | email | indicacao | site" },
      { name: "pn_requested / quantity / desired_condition", type: "text / int / text" },
      { name: "urgency", type: "urgencia", note: "aog | normal" },
      { name: "status", type: "lead_status", note: "8 estágios" },
      { name: "customer_id", type: "uuid", key: "fk", note: "novo — lead vira cliente conhecido" },
      { name: "converted_quote_id", type: "uuid", key: "fk", note: "novo — fecha o elo lead → cotação" },
      { name: "owner_id", type: "uuid", key: "fk", note: "novo — responsible é texto livre hoje" },
      { name: "first_response_at", type: "timestamptz", note: "novo — base do SLA de resposta" },
      { name: "raw_payload", type: "jsonb", note: "novo — mensagem original do WhatsApp para o agente de IA" },
    ],
    relations: ["N:1 customers", "1:1 quotes (via converted_quote_id)"],
    indexes: ["btree(status, urgency) WHERE NOT archived", "btree(owner_id)"],
    rls: "SELECT: todos. INSERT/UPDATE: admin, ceo, comercial. Operador só vê e edita os próprios (owner_id = auth.uid()).",
  },
  {
    name: "quotes",
    layer: "comercial",
    maturity: "revisada",
    purpose: "A cotação ao cliente — o centro de gravidade do sistema.",
    columns: [
      { name: "internal_number", type: "text", key: "uk", note: "UNIQUE, preenchido por next_document_number()" },
      { name: "customer_id / aircraft_id", type: "uuid", key: "fk" },
      { name: "owner_id", type: "uuid", key: "fk", note: "substitui responsible texto" },
      { name: "is_aog", type: "boolean" },
      { name: "status", type: "quote_status", note: "10 estágios, protegido por status_transitions" },
      { name: "supplier_cost / final_price / real_margin", type: "numeric", note: "passam a ser calculados por trigger a partir de quote_items" },
      { name: "freight / import_fee", type: "numeric" },
      { name: "desired_margin", type: "numeric", note: "DEFAULT vindo de settings.finance.min_margin" },
      { name: "currency", type: "text", note: "novo — DEFAULT 'USD'" },
      { name: "exchange_rate", type: "numeric", note: "passa a ser resolvido de fx_rates na data da cotação" },
      { name: "valid_until", type: "date", note: "CHECK valid_until >= quote_date" },
      { name: "last_followup / followup_due_at", type: "timestamptz", note: "followup_due_at é novo: 4h para AOG, 24h normal" },
      { name: "lost_reason", type: "text", note: "novo — obrigatório ao mover para 'perdido'" },
    ],
    relations: ["1:N quote_items", "1:N rfqs", "1:N estimates", "1:N purchase_orders", "1:N certificates"],
    indexes: [
      "btree(status) WHERE NOT archived — o Kanban",
      "btree(is_aog, status) WHERE is_aog AND NOT archived — o alerta AOG",
      "btree(followup_due_at) WHERE status NOT IN ('aprovado','perdido','cancelado')",
    ],
    rls: "SELECT: todos. INSERT/UPDATE: admin, ceo, comercial. Mudança de status ainda passa pela máquina de estados.",
    notes: [
      "A regra atual de preço é preço = custo / (1 − margem/100). Como real_margin é derivada do mesmo cálculo, ela sempre iguala desired_margin — o alerta de margem baixa nunca dispara por custo real, só se alguém digitar margem desejada abaixo de 20.",
      "Com os totais vindos dos itens, real_margin passa a refletir o custo efetivo do fornecedor escolhido.",
    ],
  },
  {
    name: "quote_items",
    layer: "comercial",
    maturity: "revisada",
    purpose:
      "Itens de linha da cotação. A tabela existe na migration e não tem nenhuma tela — hoje uma cotação é um valor único sem discriminação de peças.",
    columns: [
      { name: "quote_id", type: "uuid", key: "fk", note: "ON DELETE CASCADE" },
      { name: "part_id", type: "uuid", key: "fk" },
      { name: "pn / description / condition", type: "text" },
      { name: "quantity", type: "int", note: "CHECK > 0" },
      { name: "unit_cost / unit_price", type: "numeric(14,2)" },
      { name: "line_total", type: "numeric", note: "GENERATED ALWAYS AS (quantity * unit_price) STORED" },
      { name: "chosen_supplier_quote_id", type: "uuid", key: "fk", note: "novo — qual resposta de fornecedor virou este preço" },
      { name: "position", type: "int", note: "novo — ordenação estável" },
    ],
    rls: "Herda quotes. Trigger recalc_quote_totals dispara em INSERT, UPDATE e DELETE.",
  },
  {
    name: "rfqs",
    layer: "comercial",
    maturity: "revisada",
    purpose: "Requisição de cotação enviada a um fornecedor.",
    columns: [
      { name: "rfq_number", type: "text", key: "uk", note: "UNIQUE, via next_document_number()" },
      { name: "quote_id / supplier_id", type: "uuid", key: "fk" },
      { name: "supplier_contact_id", type: "uuid", key: "fk", note: "novo" },
      { name: "status", type: "rfq_status" },
      { name: "sent_at / responded_at", type: "timestamptz", note: "eram date — hora importa em AOG" },
      { name: "message_body", type: "text", note: "novo — o texto efetivamente enviado, não o template" },
      { name: "email_message_id", type: "text", note: "novo — casa a resposta recebida com o RFQ" },
      { name: "due_at", type: "timestamptz", note: "novo — prazo de resposta" },
    ],
    relations: ["N:1 quotes", "N:1 suppliers", "1:N rfq_items", "1:N supplier_quotes"],
    rls: "SELECT: todos. INSERT/UPDATE: admin, ceo, compras.",
  },
  {
    name: "rfq_items",
    layer: "comercial",
    maturity: "existente",
    purpose: "As peças pedidas em cada RFQ. Existe na migration, sem tela.",
    columns: [
      { name: "rfq_id", type: "uuid", key: "fk", note: "ON DELETE CASCADE" },
      { name: "part_id / pn / description", type: "uuid / text" },
      { name: "quantity / condition_requested", type: "int / text" },
      { name: "quote_item_id", type: "uuid", key: "fk", note: "novo — amarra ao item da cotação" },
    ],
    rls: "Herda rfqs.",
  },
  {
    name: "supplier_quotes",
    layer: "comercial",
    maturity: "revisada",
    purpose:
      "A resposta do fornecedor: preço, prazo, condição e certificação. É o coração da decisão de compra e hoje não tem interface nenhuma — a comparação entre fornecedores acontece fora do sistema.",
    columns: [
      { name: "rfq_id / supplier_id", type: "uuid", key: "fk" },
      { name: "rfq_item_id", type: "uuid", key: "fk", note: "novo — resposta por item, não por RFQ" },
      { name: "pn / condition / certification", type: "text / text / cert_type" },
      { name: "price", type: "numeric(14,2)" },
      { name: "lead_time_days", type: "int", note: "era texto" },
      { name: "quantity_available", type: "int", note: "novo" },
      { name: "core_required", type: "boolean", note: "novo — devolução de unidade usada, muda o custo real" },
      { name: "valid_until", type: "date", note: "novo" },
      { name: "chosen", type: "boolean", note: "índice único parcial: uma escolha por rfq_item" },
      { name: "score", type: "numeric", note: "novo — nota composta preço × prazo × rating, gerada por RPC" },
    ],
    indexes: ["UNIQUE(rfq_item_id) WHERE chosen"],
    rls: "SELECT: todos. INSERT/UPDATE: admin, ceo, compras.",
  },

  // ─────────────────────── DOCUMENTOS ───────────────────────
  {
    name: "estimates",
    layer: "documentos",
    maturity: "revisada",
    purpose: "Proposta formal ao cliente, gerada da cotação aprovada internamente.",
    columns: [
      { name: "estimate_number", type: "text", key: "uk", note: "UNIQUE" },
      { name: "quote_id / customer_id", type: "uuid", key: "fk" },
      { name: "total", type: "numeric", note: "calculado dos itens" },
      { name: "status", type: "fin_doc_status" },
      { name: "valid_until / terms", type: "date / text" },
      { name: "sent_at / viewed_at / accepted_at", type: "timestamptz", note: "novos — rastreiam a resposta do cliente" },
      { name: "pdf_document_id", type: "uuid", key: "fk", note: "novo → documents" },
      { name: "quickbooks_id", type: "text", note: "novo — idempotência da sincronização" },
    ],
    rls: "SELECT: todos. INSERT/UPDATE: admin, ceo, financeiro, comercial.",
  },
  {
    name: "invoices",
    layer: "documentos",
    maturity: "revisada",
    purpose: "Fatura ao cliente.",
    columns: [
      { name: "invoice_number", type: "text", key: "uk", note: "UNIQUE" },
      { name: "quote_id / estimate_id / customer_id", type: "uuid", key: "fk" },
      { name: "total", type: "numeric", note: "derivado de invoice_items" },
      { name: "amount_paid", type: "numeric", note: "novo — mantido por trigger de payments" },
      { name: "balance", type: "numeric", note: "novo — GENERATED (total − amount_paid)" },
      { name: "status", type: "fin_doc_status", note: "vira 'pago' automaticamente quando balance = 0" },
      { name: "issue_date / due_date", type: "date", note: "due_date default = issue_date + customers.payment_terms_days" },
      { name: "quickbooks_id", type: "text", note: "novo" },
    ],
    relations: ["1:N invoice_items", "1:N payments", "1:N logistics"],
    indexes: ["btree(due_date) WHERE status NOT IN ('pago','cancelado') — contas a receber"],
    rls: "SELECT: todos. INSERT/UPDATE: admin, ceo, financeiro.",
  },
  {
    name: "invoice_items",
    layer: "documentos",
    maturity: "nova",
    purpose:
      "Itens da fatura. Sem eles a invoice é um valor solto e a commercial invoice de exportação — que precisa listar peça a peça com valor e país de origem — não pode ser gerada pelo sistema.",
    columns: [
      { name: "invoice_id", type: "uuid", key: "fk", note: "ON DELETE CASCADE" },
      { name: "quote_item_id / part_id", type: "uuid", key: "fk" },
      { name: "pn / description / hts_code / country_of_origin", type: "text", note: "hts_code e origem são exigidos na exportação" },
      { name: "quantity / unit_price", type: "int / numeric" },
      { name: "line_total", type: "numeric", note: "GENERATED STORED" },
    ],
    rls: "Herda invoices.",
  },
  {
    name: "purchase_orders",
    layer: "documentos",
    maturity: "revisada",
    purpose: "Ordem de compra ao fornecedor.",
    columns: [
      { name: "po_number", type: "text", key: "uk", note: "UNIQUE" },
      { name: "quote_id / supplier_id", type: "uuid", key: "fk" },
      { name: "total", type: "numeric", note: "derivado dos itens" },
      { name: "status", type: "po_status", note: "9 estágios" },
      { name: "purchase_date / payment_method / tracking", type: "date / text / text" },
      { name: "certificate_received", type: "boolean", note: "deixa de ser um switch manual — passa a ser derivado de certificates" },
      { name: "approved_by / approved_at", type: "uuid / timestamptz", note: "novos — compra acima de um teto exige aprovação de ceo" },
      { name: "quickbooks_id", type: "text", note: "novo" },
    ],
    relations: ["1:N purchase_order_items", "1:N certificates", "1:N payments", "1:N logistics"],
    rls: "SELECT: todos. INSERT/UPDATE: admin, ceo, compras. Aprovação: só admin e ceo.",
  },
  {
    name: "purchase_order_items",
    layer: "documentos",
    maturity: "existente",
    purpose: "Itens da PO. Existe na migration, sem tela.",
    columns: [
      { name: "po_id", type: "uuid", key: "fk", note: "ON DELETE CASCADE" },
      { name: "part_id / pn / description / condition", type: "uuid / text" },
      { name: "quantity / unit_cost", type: "int / numeric" },
      { name: "received_quantity", type: "int", note: "novo — recebimento parcial é comum" },
      { name: "serial_numbers", type: "text[]", note: "novo — casa com o certificado e o estoque" },
    ],
    rls: "Herda purchase_orders.",
  },
  {
    name: "certificates",
    layer: "documentos",
    maturity: "revisada",
    purpose:
      "FAA 8130-3, EASA Form 1, COC, MFG Cert, TAG, Trace, Non-Incident. Peça sem rastreabilidade documental não voa — este é o controle regulatório do negócio.",
    columns: [
      { name: "cert_type", type: "cert_type" },
      { name: "part_id / pn / serial_number", type: "uuid / text / text" },
      { name: "purchase_order_id", type: "uuid", key: "fk", note: "novo — hoje só liga a quote e supplier, então o portão de liberação da PO não tem como ser verificado" },
      { name: "po_item_id", type: "uuid", key: "fk", note: "novo" },
      { name: "supplier_id / customer_id / quote_id", type: "uuid", key: "fk" },
      { name: "document_id", type: "uuid", key: "fk", note: "novo → documents; substitui file_url texto" },
      { name: "issue_date / valid_until", type: "date" },
      { name: "status", type: "cert_status", note: "pendente recebido aprovado rejeitado" },
      { name: "required", type: "boolean" },
      { name: "reviewed_by / reviewed_at / rejection_reason", type: "uuid / timestamptz / text", note: "novos — quem aprovou responde por isso" },
    ],
    indexes: ["btree(purchase_order_id) WHERE required AND status <> 'aprovado' — o portão"],
    rls: "SELECT: todos. INSERT/UPDATE: admin, ceo, compras, logistica. Aprovar/rejeitar: admin, ceo, logistica.",
  },
  {
    name: "documents",
    layer: "documentos",
    maturity: "nova",
    purpose:
      "Índice único de todo arquivo do sistema, apontando para o Supabase Storage. Hoje certificates.file_url é texto livre e o botão de upload só mostra um toast.",
    columns: [
      { name: "bucket / path", type: "text", note: "UNIQUE(bucket, path)" },
      { name: "filename / mime_type / size_bytes / checksum", type: "text / text / bigint / text" },
      { name: "entity / entity_id", type: "text / uuid", note: "polimórfico: certificate, invoice, logistics…" },
      { name: "kind", type: "text", note: "certificate | packing_list | commercial_invoice | pdf | anexo" },
      { name: "uploaded_by", type: "uuid", key: "fk" },
    ],
    indexes: ["btree(entity, entity_id)"],
    rls: "SELECT: todos. INSERT: qualquer autenticado. DELETE: admin. Políticas espelhadas em storage.objects.",
  },

  // ─────────────────────── OPERAÇÃO ───────────────────────
  {
    name: "logistics",
    layer: "operacao",
    maturity: "revisada",
    purpose: "O processo físico: fornecedor → Deerfield → exportação → nacionalização → cliente.",
    columns: [
      { name: "invoice_id / quote_id / customer_id / supplier_id", type: "uuid", key: "fk" },
      { name: "purchase_order_id", type: "uuid", key: "fk", note: "novo" },
      { name: "status", type: "logistics_status", note: "9 estágios, do aguardando_peca ao entregue" },
      { name: "carrier / supplier_tracking", type: "text" },
      { name: "outbound_tracking", type: "text", note: "novo — o trecho Deerfield → Brasil tem tracking próprio" },
      { name: "weight / dimensions", type: "numeric / text" },
      { name: "declared_value / incoterm", type: "numeric / text", note: "novos — exigidos na exportação" },
      { name: "customs_entry_number", type: "text", note: "novo — DI da nacionalização" },
      { name: "expected_date / delivered_date", type: "date" },
      { name: "packing_list / commercial_invoice", type: "text", note: "passam a ser FK para documents" },
    ],
    indexes: ["btree(status) WHERE status <> 'entregue'", "btree(expected_date) WHERE status <> 'entregue'"],
    rls: "SELECT: todos. INSERT/UPDATE: admin, ceo, logistica.",
  },
  {
    name: "logistics_events",
    layer: "operacao",
    maturity: "nova",
    purpose:
      "Histórico imutável de cada movimentação. Com só um campo status, quando um embarque atrasa ninguém sabe onde parou nem por quanto tempo — e o SLA por etapa é incalculável.",
    columns: [
      { name: "logistics_id", type: "uuid", key: "fk", note: "ON DELETE CASCADE" },
      { name: "from_status / to_status", type: "logistics_status" },
      { name: "occurred_at", type: "timestamptz", note: "DEFAULT now()" },
      { name: "source", type: "text", note: "manual | carrier_api | edge_function" },
      { name: "note / raw_payload", type: "text / jsonb" },
      { name: "actor_id", type: "uuid", key: "fk" },
    ],
    indexes: ["btree(logistics_id, occurred_at DESC)"],
    rls: "SELECT: todos. INSERT: via trigger e edge function. UPDATE/DELETE: ninguém — append-only.",
  },
  {
    name: "stock_items",
    layer: "operacao",
    maturity: "nova",
    purpose:
      "Peça em nível de serial parada no hub de Deerfield. O sistema hoje assume que toda peça é comprada sob demanda; na prática sobra estoque de core, de compra em lote e de devolução.",
    columns: [
      { name: "part_id", type: "uuid", key: "fk" },
      { name: "serial_number", type: "text", key: "uk" },
      { name: "condition", type: "part_condition" },
      { name: "location", type: "text", note: "deerfield | em_transito | cliente" },
      { name: "acquisition_cost", type: "numeric" },
      { name: "purchase_order_id / certificate_id", type: "uuid", key: "fk" },
      { name: "status", type: "text", note: "disponivel | reservado | vendido | em_reparo" },
      { name: "reserved_for_quote_id", type: "uuid", key: "fk" },
    ],
    rls: "SELECT: todos. INSERT/UPDATE: admin, ceo, logistica, compras.",
  },

  // ─────────────────────── FINANCEIRO ───────────────────────
  {
    name: "payments",
    layer: "financeiro",
    maturity: "revisada",
    purpose: "Movimentos de entrada (cliente paga) e saída (pagamento ao fornecedor).",
    columns: [
      { name: "type", type: "payment_type", note: "recebido | enviado" },
      { name: "invoice_id / po_id", type: "uuid", key: "fk", note: "CHECK: exatamente um dos dois preenchido" },
      { name: "amount", type: "numeric(14,2)", note: "CHECK > 0" },
      { name: "currency / fx_rate_id", type: "text / uuid", note: "novos" },
      { name: "amount_usd", type: "numeric", note: "novo — normalizado para relatório" },
      { name: "payment_date / method / reference", type: "date / text / text" },
      { name: "quickbooks_id", type: "text", note: "novo" },
    ],
    rls: "SELECT: admin, ceo, financeiro. INSERT/UPDATE: admin, ceo, financeiro. Demais papéis não veem valores pagos.",
    notes: ["Trigger atualiza invoices.amount_paid e fecha a fatura como 'pago' quando o saldo zera."],
  },
  {
    name: "expenses",
    layer: "financeiro",
    maturity: "revisada",
    purpose: "Despesas operacionais que entram no lucro bruto.",
    columns: [
      { name: "description", type: "text", note: "NOT NULL" },
      { name: "category", type: "text", note: "vira enum: frete, armazenagem, aduana, software, folha…" },
      { name: "amount / expense_date", type: "numeric / date" },
      { name: "logistics_id", type: "uuid", key: "fk", note: "novo — permite custo real por embarque" },
      { name: "document_id", type: "uuid", key: "fk", note: "novo — comprovante" },
    ],
    rls: "SELECT: admin, ceo, financeiro. INSERT/UPDATE: admin, ceo, financeiro.",
  },
  {
    name: "fx_rates",
    layer: "financeiro",
    maturity: "nova",
    purpose:
      "Câmbio USD/BRL datado. O sistema vende no Brasil e cobra em dólar, mas hoje exchange_rate é um número solto na cotação, default 5.0, que ninguém atualiza e nenhum cálculo usa.",
    columns: [
      { name: "base / quote_currency", type: "text", note: "DEFAULT 'USD' / 'BRL'" },
      { name: "rate", type: "numeric(12,6)" },
      { name: "valid_on", type: "date", key: "uk", note: "UNIQUE(base, quote_currency, valid_on)" },
      { name: "source", type: "text", note: "ptax | openexchange | manual" },
    ],
    rls: "SELECT: todos. INSERT: edge function fx-rate-sync (service role) e admin.",
  },

  // ─────────────────────── AUTOMAÇÃO ───────────────────────
  {
    name: "ai_agents",
    layer: "automacao",
    maturity: "revisada",
    purpose: "Registro dos agentes: atendimento, cotação, financeiro, logística, CEO e análise de dados.",
    columns: [
      { name: "agent_key", type: "text", key: "uk", note: "UNIQUE — hoje sem unicidade" },
      { name: "name / description", type: "text" },
      { name: "enabled", type: "boolean" },
      { name: "model", type: "text", note: "novo — modelo por agente" },
      { name: "system_prompt", type: "text", note: "novo — editável sem deploy" },
      { name: "schedule_cron", type: "text", note: "novo — para agentes agendados" },
      { name: "config", type: "jsonb" },
      { name: "last_run_at / last_status", type: "timestamptz / text" },
    ],
    rls: "SELECT: todos. UPDATE: admin e ceo. Só admin edita system_prompt.",
  },
  {
    name: "agent_runs",
    layer: "automacao",
    maturity: "nova",
    purpose:
      "Uma linha por execução, com entrada, saída, tokens, custo e erro. Hoje 'automations' guarda a string 'Execução simulada concluída' e nada mais — não dá para auditar o que a IA decidiu.",
    columns: [
      { name: "agent_key", type: "text", key: "fk" },
      { name: "trigger", type: "text", note: "manual | cron | webhook" },
      { name: "input / output", type: "jsonb" },
      { name: "status", type: "text", note: "running | ok | error" },
      { name: "error_message", type: "text" },
      { name: "prompt_tokens / completion_tokens / cost_usd", type: "int / int / numeric" },
      { name: "duration_ms", type: "int" },
      { name: "entity / entity_id", type: "text / uuid", note: "o que a execução tocou" },
      { name: "actor_id", type: "uuid", key: "fk" },
    ],
    indexes: ["btree(agent_key, created_at DESC)"],
    rls: "SELECT: admin, ceo. INSERT: service role.",
  },
  {
    name: "notifications",
    layer: "automacao",
    maturity: "nova",
    purpose:
      "Fila de alertas. Os avisos de AOG, margem baixa, follow-up vencido e certificado pendente hoje só existem enquanto a página está aberta — ninguém é notificado de fato.",
    columns: [
      { name: "user_id", type: "uuid", key: "fk", note: "nulo se for para um papel inteiro" },
      { name: "role_target", type: "app_role", note: "alternativa a user_id" },
      { name: "severity", type: "text", note: "info | warning | critical" },
      { name: "title / body", type: "text" },
      { name: "entity / entity_id", type: "text / uuid", note: "deep link para o registro" },
      { name: "channel", type: "text[]", note: "in_app | email | whatsapp" },
      { name: "read_at / sent_at", type: "timestamptz" },
    ],
    indexes: ["btree(user_id, read_at) WHERE read_at IS NULL"],
    rls: "SELECT/UPDATE: o destinatário (user_id = auth.uid() ou role_target no conjunto de papéis do usuário). INSERT: service role e triggers.",
    notes: ["Publicada via Supabase Realtime — o sino no header atualiza sem polling."],
  },
  {
    name: "automations",
    layer: "automacao",
    maturity: "revisada",
    purpose: "Log resumido para a tela de Automações. Vira uma view sobre agent_runs.",
    columns: [
      { name: "agent_key / title / result / status", type: "text" },
      { name: "created_at", type: "timestamptz" },
    ],
    rls: "SELECT: todos autenticados.",
  },

  // ─────────────────────── AUDITORIA ───────────────────────
  {
    name: "record_versions",
    schema: "audit",
    layer: "auditoria",
    maturity: "nova",
    purpose:
      "Trilha completa por trigger. Registra INSERT, UPDATE e DELETE de toda tabela sensível com o diff e o autor tirado do JWT — impossível de burlar pelo front.",
    columns: [
      { name: "id", type: "bigserial", key: "pk" },
      { name: "table_name / record_id / op", type: "text / uuid / text" },
      { name: "old_data / new_data", type: "jsonb" },
      { name: "changed_fields", type: "text[]", note: "só o que mudou de fato" },
      { name: "actor_id / actor_email", type: "uuid / text", note: "auth.uid() e auth.jwt()->>'email'" },
      { name: "at", type: "timestamptz" },
    ],
    indexes: ["btree(table_name, record_id, at DESC)", "GIN(changed_fields)"],
    rls: "SELECT: admin e ceo. Nenhum papel pode INSERT, UPDATE ou DELETE — só o trigger, que é SECURITY DEFINER.",
    notes: ["Particionada por mês (at) quando o volume crescer; retenção de 24 meses."],
  },
  {
    name: "activity_logs",
    layer: "auditoria",
    maturity: "revisada",
    purpose:
      "Feed legível de atividade para a aba Logs. Continua existindo, mas passa a ser alimentado por trigger em vez de pela chamada logActivity() do front, que pode ser esquecida ou falhar em silêncio.",
    columns: [
      { name: "user_id / user_name", type: "uuid / text" },
      { name: "action / entity / entity_id / details", type: "text" },
      { name: "created_at", type: "timestamptz" },
    ],
    rls: "SELECT: admin e ceo. INSERT: apenas triggers.",
  },
];

// ───────────────────────── PAPÉIS E PERMISSÕES ─────────────────────────

export interface RoleDoc {
  key: string;
  label: string;
  scope: string;
}

export const roles: RoleDoc[] = [
  { key: "admin", label: "Administrador", scope: "Tudo, incluindo papéis, credenciais de fornecedor e auditoria." },
  { key: "ceo", label: "CEO", scope: "Leitura total, aprovação de compras acima do teto e todos os relatórios financeiros." },
  { key: "comercial", label: "Comercial", scope: "Leads, clientes, cotações e estimates. Não vê pagamentos nem custo de fornecedor." },
  { key: "compras", label: "Compras", scope: "RFQs, respostas de fornecedor, POs e certificados. Não altera preço ao cliente." },
  { key: "financeiro", label: "Financeiro", scope: "Invoices, pagamentos, despesas e câmbio. Leitura do resto." },
  { key: "logistica", label: "Logística", scope: "Embarques, eventos, estoque e aprovação de certificados." },
  { key: "operador", label: "Operador", scope: "Leitura geral e edição apenas dos próprios leads. Sem acesso a valores financeiros." },
];

export type Perm = "—" | "R" | "RW" | "RW+";

export interface MatrixRow {
  module: string;
  perms: Record<string, Perm>;
}

// R = ler · RW = ler e escrever · RW+ = escrever com poder extra (aprovar, liberar) · — = sem acesso
export const permissionMatrix: MatrixRow[] = [
  { module: "Leads",          perms: { admin: "RW+", ceo: "RW", comercial: "RW", compras: "R", financeiro: "R", logistica: "R", operador: "RW" } },
  { module: "Clientes",       perms: { admin: "RW+", ceo: "RW", comercial: "RW", compras: "R", financeiro: "R", logistica: "R", operador: "R" } },
  { module: "Cotações",       perms: { admin: "RW+", ceo: "RW+", comercial: "RW", compras: "R", financeiro: "R", logistica: "R", operador: "R" } },
  { module: "RFQs",           perms: { admin: "RW+", ceo: "RW", comercial: "R", compras: "RW", financeiro: "—", logistica: "R", operador: "R" } },
  { module: "Fornecedores",   perms: { admin: "RW+", ceo: "RW", comercial: "R", compras: "RW", financeiro: "R", logistica: "R", operador: "R" } },
  { module: "Credenciais",    perms: { admin: "RW+", ceo: "—", comercial: "—", compras: "—", financeiro: "—", logistica: "—", operador: "—" } },
  { module: "Peças / PN",     perms: { admin: "RW+", ceo: "RW", comercial: "RW", compras: "RW", financeiro: "R", logistica: "R", operador: "R" } },
  { module: "Certificados",   perms: { admin: "RW+", ceo: "RW", comercial: "R", compras: "RW", financeiro: "R", logistica: "RW+", operador: "R" } },
  { module: "Compras / PO",   perms: { admin: "RW+", ceo: "RW+", comercial: "R", compras: "RW", financeiro: "R", logistica: "R", operador: "R" } },
  { module: "Logística",      perms: { admin: "RW+", ceo: "RW", comercial: "R", compras: "R", financeiro: "R", logistica: "RW", operador: "R" } },
  { module: "Financeiro",     perms: { admin: "RW+", ceo: "RW", comercial: "—", compras: "—", financeiro: "RW", logistica: "—", operador: "—" } },
  { module: "Configurações",  perms: { admin: "RW+", ceo: "RW", comercial: "—", compras: "—", financeiro: "—", logistica: "—", operador: "—" } },
  { module: "Auditoria",      perms: { admin: "R", ceo: "R", comercial: "—", compras: "—", financeiro: "—", logistica: "—", operador: "—" } },
];

// ───────────────────────── RPCs ─────────────────────────

export interface RpcDoc {
  name: string;
  signature: string;
  returns: string;
  security: "DEFINER" | "INVOKER";
  group: string;
  purpose: string;
  rules?: string[];
}

export const rpcs: RpcDoc[] = [
  {
    name: "next_document_number",
    signature: "next_document_number(_doc_type text)",
    returns: "text",
    security: "DEFINER",
    group: "Fundação",
    purpose: "Devolve o próximo número formatado (COT-2026-0042) de forma atômica.",
    rules: [
      "INSERT … ON CONFLICT DO UPDATE RETURNING — sem race condition mesmo com dois usuários salvando ao mesmo tempo.",
      "Reinicia a numeração a cada ano civil.",
    ],
  },
  {
    name: "create_quote_from_lead",
    signature: "create_quote_from_lead(_lead_id uuid, _customer_id uuid DEFAULT NULL)",
    returns: "uuid",
    security: "INVOKER",
    group: "Comercial",
    purpose: "Converte um lead qualificado em cotação, criando o cliente se ainda não existir.",
    rules: [
      "Copia PN, quantidade, condição e urgência do lead para o primeiro quote_item.",
      "is_aog herda de leads.urgency = 'aog'.",
      "Grava leads.converted_quote_id e move o lead para 'em_cotacao' — hoje esse elo não existe.",
      "Falha se o lead já foi convertido.",
    ],
  },
  {
    name: "recalculate_quote",
    signature: "recalculate_quote(_quote_id uuid)",
    returns: "jsonb",
    security: "INVOKER",
    group: "Comercial",
    purpose: "Recalcula custo, preço e margem real da cotação a partir dos itens.",
    rules: [
      "custo = Σ(quantidade × custo_unitário) + frete + taxa de importação.",
      "margem_real = (preço − custo) / preço × 100 — a margem sobre o preço de venda, não markup.",
      "Roda também como trigger em quote_items; a RPC existe para recálculo manual e para a tela de precificação.",
    ],
  },
  {
    name: "price_quote",
    signature: "price_quote(_quote_id uuid, _target_margin numeric DEFAULT NULL)",
    returns: "jsonb",
    security: "INVOKER",
    group: "Comercial",
    purpose: "Aplica a margem alvo e devolve o preço sugerido por item e o total.",
    rules: [
      "preço = custo / (1 − margem/100). Se _target_margin for nulo usa settings.finance.min_margin.",
      "Recusa margem >= 100 (divisão por zero) e margem negativa.",
      "Devolve um aviso quando a margem resultante fica abaixo do mínimo configurado, em vez de bloquear.",
    ],
  },
  {
    name: "score_supplier_quotes",
    signature: "score_supplier_quotes(_rfq_item_id uuid)",
    returns: "TABLE(supplier_quote_id uuid, score numeric, rank int)",
    security: "INVOKER",
    group: "Comercial",
    purpose: "Ordena as respostas de fornecedor por nota composta.",
    rules: [
      "Nota = preço normalizado (50%) + prazo (30%) + rating interno (20%), com peso do prazo dobrado quando a cotação é AOG.",
      "Desclassifica resposta sem a certificação exigida pela peça.",
      "É o insumo do agente de cotação — a recomendação da IA passa a ter base determinística.",
    ],
  },
  {
    name: "choose_supplier_quote",
    signature: "choose_supplier_quote(_supplier_quote_id uuid)",
    returns: "void",
    security: "INVOKER",
    group: "Comercial",
    purpose: "Marca a resposta escolhida e propaga o custo para o item da cotação.",
    rules: [
      "Desmarca as concorrentes do mesmo rfq_item (garantido também por índice único parcial).",
      "Atualiza quote_items.unit_cost e chosen_supplier_quote_id, disparando o recálculo.",
      "Move o RFQ para 'escolhido' e os demais RFQs do item para 'recusado'.",
    ],
  },
  {
    name: "approve_quote",
    signature: "approve_quote(_quote_id uuid)",
    returns: "uuid",
    security: "INVOKER",
    group: "Documentos",
    purpose: "Aprova a cotação e gera o Estimate correspondente.",
    rules: [
      "Bloqueia se a cotação não tiver itens ou se algum item estiver sem fornecedor escolhido.",
      "Numera o estimate por next_document_number e copia os itens.",
      "Exige justificativa quando a margem real está abaixo do mínimo — o registro fica na auditoria.",
    ],
  },
  {
    name: "convert_estimate_to_invoice",
    signature: "convert_estimate_to_invoice(_estimate_id uuid)",
    returns: "uuid",
    security: "INVOKER",
    group: "Documentos",
    purpose: "Gera a Invoice a partir do Estimate aceito pelo cliente.",
    rules: [
      "due_date = hoje + customers.payment_terms_days.",
      "Copia os itens para invoice_items preservando HTS code e país de origem.",
      "Idempotente: chamar duas vezes devolve a invoice já existente em vez de duplicar.",
    ],
  },
  {
    name: "create_po_from_quote",
    signature: "create_po_from_quote(_quote_id uuid, _supplier_id uuid)",
    returns: "uuid",
    security: "INVOKER",
    group: "Documentos",
    purpose: "Emite a PO com os itens cujo fornecedor escolhido é o informado.",
    rules: [
      "Uma cotação com três fornecedores escolhidos gera três POs distintas.",
      "Cria os registros de certificate em 'pendente' para cada certificação exigida pelas peças.",
      "Marca approval_required quando o total ultrapassa settings.finance.po_approval_threshold.",
    ],
  },
  {
    name: "approve_purchase_order",
    signature: "approve_purchase_order(_po_id uuid)",
    returns: "void",
    security: "INVOKER",
    group: "Documentos",
    purpose: "Aprovação formal de compra acima do teto.",
    rules: ["Só admin e ceo. Grava approved_by e approved_at e libera a transição de status."],
  },
  {
    name: "advance_logistics",
    signature: "advance_logistics(_logistics_id uuid, _to_status logistics_status, _note text DEFAULT NULL)",
    returns: "void",
    security: "INVOKER",
    group: "Operação",
    purpose: "Avança o embarque de etapa registrando o evento.",
    rules: [
      "Valida a transição contra status_transitions.",
      "Grava a linha em logistics_events com o autor e a origem.",
      "Ao chegar em 'entregue' preenche delivered_date e recalcula suppliers.on_time_rate.",
    ],
  },
  {
    name: "register_payment",
    signature: "register_payment(_type payment_type, _target_id uuid, _amount numeric, _date date, _method text)",
    returns: "uuid",
    security: "INVOKER",
    group: "Financeiro",
    purpose: "Registra recebimento ou pagamento e reconcilia o documento.",
    rules: [
      "Converte para USD usando fx_rates da data informada.",
      "Atualiza invoices.amount_paid e fecha a fatura como 'pago' quando o saldo zera.",
      "Recusa valor que exceda o saldo em aberto.",
    ],
  },
  {
    name: "dashboard_metrics",
    signature: "dashboard_metrics(_from date DEFAULT NULL, _to date DEFAULT NULL)",
    returns: "jsonb",
    security: "INVOKER",
    group: "Analítico",
    purpose: "Todos os indicadores do Dashboard em uma chamada.",
    rules: [
      "Substitui as 8 consultas useRows que o Dashboard dispara hoje trazendo tabelas inteiras para o browser só para contar linhas.",
      "SECURITY INVOKER de propósito: a RLS continua valendo, então o operador não vê faturamento.",
      "Entrega também as séries que hoje são valores fixos no código: vendas por mês, PNs mais cotados, fornecedores mais usados e tempo médio de resposta.",
    ],
  },
  {
    name: "quote_pipeline",
    signature: "quote_pipeline()",
    returns: "TABLE(status quote_status, count bigint, total_value numeric, aog_count bigint)",
    security: "INVOKER",
    group: "Analítico",
    purpose: "Contagem e valor por coluna do Kanban, sem baixar as cotações inteiras.",
  },
  {
    name: "check_certificate_gate",
    signature: "check_certificate_gate(_po_id uuid)",
    returns: "TABLE(ok boolean, missing jsonb)",
    security: "INVOKER",
    group: "Documentos",
    purpose: "Diz se a PO pode ser liberada e, se não, quais certificados faltam.",
    rules: ["Mesma lógica usada pelo trigger de bloqueio — a UI consulta antes de oferecer o botão."],
  },
  {
    name: "search_global",
    signature: "search_global(_term text, _limit int DEFAULT 20)",
    returns: "TABLE(entity text, id uuid, title text, subtitle text, rank real)",
    security: "INVOKER",
    group: "Analítico",
    purpose: "Busca única sobre PN, cliente, cotação, PO e tracking.",
    rules: ["Usa os índices GIN de trigram e tsvector; alimenta um Cmd+K no header."],
  },
];

// ───────────────────────── TRIGGERS ─────────────────────────

export interface TriggerDoc {
  name: string;
  on: string;
  when: string;
  purpose: string;
}

export const triggers: TriggerDoc[] = [
  { name: "set_updated_at", on: "todas as tabelas com updated_at", when: "BEFORE UPDATE", purpose: "Carimba now(). Já existe hoje." },
  { name: "set_actor", on: "todas as tabelas com created_by/updated_by", when: "BEFORE INSERT OR UPDATE", purpose: "Preenche o autor com auth.uid(). Hoje created_by existe em customers e nunca é populado." },
  { name: "handle_new_user", on: "auth.users", when: "AFTER INSERT", purpose: "Cria o profile e concede o papel — admin se for o primeiro usuário, senão operador. Já existe." },
  { name: "audit_track_changes", on: "18 tabelas de negócio", when: "AFTER INSERT/UPDATE/DELETE", purpose: "Grava a versão com diff em audit.record_versions e o resumo legível em activity_logs." },
  { name: "recalc_quote_totals", on: "quote_items", when: "AFTER INSERT/UPDATE/DELETE", purpose: "Recalcula custo, preço final e margem real da cotação-pai." },
  { name: "recalc_po_total", on: "purchase_order_items", when: "AFTER INSERT/UPDATE/DELETE", purpose: "Mantém purchase_orders.total coerente com os itens." },
  { name: "recalc_invoice_total", on: "invoice_items", when: "AFTER INSERT/UPDATE/DELETE", purpose: "Mantém invoices.total." },
  { name: "enforce_status_transition", on: "quotes, rfqs, purchase_orders, logistics, invoices", when: "BEFORE UPDATE OF status", purpose: "Consulta status_transitions e recusa salto inválido ou feito por papel sem permissão." },
  { name: "enforce_certificate_gate", on: "purchase_orders", when: "BEFORE UPDATE", purpose: "Levanta exceção ao tentar mover para 'liberado_logistica' com certificado obrigatório não aprovado. Hoje isso é só um banner." },
  { name: "log_logistics_event", on: "logistics", when: "AFTER UPDATE OF status", purpose: "Escreve a linha em logistics_events com from/to e autor." },
  { name: "apply_payment_to_invoice", on: "payments", when: "AFTER INSERT/UPDATE/DELETE", purpose: "Atualiza amount_paid e o status da fatura." },
  { name: "sync_po_certificate_flag", on: "certificates", when: "AFTER INSERT/UPDATE OF status", purpose: "Deriva purchase_orders.certificate_received em vez de depender do switch manual." },
  { name: "notify_aog", on: "leads, quotes", when: "AFTER INSERT/UPDATE", purpose: "Enfileira notificação crítica para comercial e ceo quando surge um AOG." },
  { name: "notify_followup_due", on: "quotes", when: "AFTER UPDATE", purpose: "Recalcula followup_due_at (4h para AOG, 24h normal) usado pelo cron de cobrança." },
  { name: "refresh_part_last_price", on: "supplier_quotes", when: "AFTER INSERT/UPDATE", purpose: "Mantém parts.last_price com o preço mais recente recebido." },
];

// ───────────────────────── EDGE FUNCTIONS ─────────────────────────

export interface EdgeFnDoc {
  name: string;
  trigger: string;
  purpose: string;
  writes: string;
  secrets: string[];
}

export const edgeFunctions: EdgeFnDoc[] = [
  {
    name: "whatsapp-inbound",
    trigger: "Webhook público (verificação de assinatura HMAC)",
    purpose:
      "Recebe a mensagem do WhatsApp Business, extrai cliente, PN, quantidade e urgência com o modelo e cria o lead já qualificado. É o agente de atendimento saindo do papel.",
    writes: "leads, agent_runs, notifications",
    secrets: ["WHATSAPP_VERIFY_TOKEN", "WHATSAPP_APP_SECRET", "LOVABLE_API_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
  },
  {
    name: "send-rfq-email",
    trigger: "Invocada pelo app (JWT do usuário)",
    purpose:
      "Monta o e-mail em inglês a partir do RFQ e dos itens, dispara para os contatos com receives_rfq e grava o Message-ID para casar a resposta depois.",
    writes: "rfqs (status, sent_at, email_message_id), agent_runs",
    secrets: ["RESEND_API_KEY", "MAIL_FROM"],
  },
  {
    name: "email-inbound",
    trigger: "Webhook do provedor de e-mail",
    purpose:
      "Lê a resposta do fornecedor, casa pelo In-Reply-To, extrai preço, prazo, condição e certificação e cria a linha em supplier_quotes para conferência humana.",
    writes: "supplier_quotes, rfqs, documents, notifications",
    secrets: ["RESEND_WEBHOOK_SECRET", "LOVABLE_API_KEY"],
  },
  {
    name: "generate-document-pdf",
    trigger: "Invocada pelo app",
    purpose:
      "Renderiza Estimate, Invoice, PO, packing list ou commercial invoice em PDF, sobe no Storage e registra em documents. Hoje todo botão de PDF é um toast.",
    writes: "documents, storage",
    secrets: ["SUPABASE_SERVICE_ROLE_KEY"],
  },
  {
    name: "quickbooks-sync",
    trigger: "Invocada pelo app + cron a cada 15 min",
    purpose:
      "OAuth2 com refresh token, empurra clientes, estimates, invoices e POs, importa pagamentos. Idempotente pelos campos quickbooks_id. O módulo inteiro é maquete hoje.",
    writes: "customers, estimates, invoices, purchase_orders, payments, agent_runs",
    secrets: ["QB_CLIENT_ID", "QB_CLIENT_SECRET", "QB_REALM_ID", "QB_REFRESH_TOKEN"],
  },
  {
    name: "tracking-poll",
    trigger: "Cron de hora em hora (pg_cron → net.http_post)",
    purpose:
      "Consulta as transportadoras pelos trackings ativos, escreve os eventos e avança o status automaticamente. Alerta quando a data prevista estoura.",
    writes: "logistics, logistics_events, notifications",
    secrets: ["FEDEX_API_KEY", "DHL_API_KEY", "UPS_API_KEY"],
  },
  {
    name: "fx-rate-sync",
    trigger: "Cron diário às 09:00 BRT",
    purpose: "Grava a cotação USD/BRL do dia. Sustenta toda a conversão de moeda que hoje não existe.",
    writes: "fx_rates",
    secrets: ["OPENEXCHANGE_APP_ID"],
  },
  {
    name: "ai-agent-runner",
    trigger: "Cron por agente (schedule_cron) + execução manual",
    purpose:
      "Executa os agentes de cotação, financeiro, logística e CEO com o system_prompt do banco, registra tokens e custo. Só o agente de análise é real hoje; os outros quatro gravam a string 'Execução simulada concluída'.",
    writes: "agent_runs, automations, notifications, ai_agents",
    secrets: ["LOVABLE_API_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
  },
  {
    name: "daily-digest",
    trigger: "Cron diário às 07:00 BRT",
    purpose:
      "Resumo do CEO por e-mail e WhatsApp: vendas, margem, AOGs abertos, follow-ups vencidos, certificados pendentes e embarques atrasados.",
    writes: "agent_runs, notifications",
    secrets: ["LOVABLE_API_KEY", "RESEND_API_KEY"],
  },
  {
    name: "followup-sweeper",
    trigger: "Cron de 30 em 30 minutos",
    purpose:
      "Varre cotações com followup_due_at vencido e notifica o dono. O aviso 'Follow-up > 24h' do Kanban hoje só aparece para quem estiver com a tela aberta.",
    writes: "notifications",
    secrets: ["SUPABASE_SERVICE_ROLE_KEY"],
  },
];

// ───────────────────────── STORAGE ─────────────────────────

export interface BucketDoc {
  name: string;
  visibility: string;
  limits: string;
  policy: string;
}

export const buckets: BucketDoc[] = [
  {
    name: "certificates",
    visibility: "Privado",
    limits: "PDF, JPG, PNG · até 20 MB",
    policy: "SELECT: todo autenticado. INSERT: compras e logistica. DELETE: admin. Caminho: certificates/{po_id}/{cert_id}.pdf",
  },
  {
    name: "documents",
    visibility: "Privado",
    limits: "PDF, XLSX, DOCX · até 25 MB",
    policy: "Estimates, invoices, packing lists e commercial invoices. Acesso por URL assinada de 60 s gerada pelo servidor.",
  },
  {
    name: "avatars",
    visibility: "Público",
    limits: "JPG, PNG, WEBP · até 2 MB",
    policy: "INSERT/UPDATE só no próprio caminho: avatars/{auth.uid()}/…",
  },
  {
    name: "imports",
    visibility: "Privado",
    limits: "CSV, XLSX · até 50 MB",
    policy: "Planilhas de catálogo e estoque de fornecedor para importação em massa. INSERT: compras e admin. Expurgo automático em 30 dias.",
  },
];

// ───────────────────────── MIGRATIONS ─────────────────────────

export interface MigrationDoc {
  file: string;
  title: string;
  contents: string;
  reversible: string;
}

export const migrations: MigrationDoc[] = [
  { file: "0001_foundation.sql", title: "Fundação", contents: "Extensões (pgcrypto, pg_trgm, citext, pg_cron, pg_net), schemas app e audit, update_updated_at_column, set_actor, document_counters, next_document_number, status_transitions.", reversible: "Sim — drop dos schemas app e audit em cascata." },
  { file: "0002_identity.sql", title: "Identidade e papéis", contents: "Enum app_role, profiles, user_roles, user_invites, app.has_role / has_any_role / is_admin / current_roles, handle_new_user.", reversible: "Sim, mas exige recriar as contas." },
  { file: "0003_catalog.sql", title: "Cadastros", contents: "customers, customer_contacts, aircraft, parts, part_alternates, suppliers, supplier_contacts, supplier_credentials. Enums customer_type e part_condition. Colunas tsvector geradas.", reversible: "Sim." },
  { file: "0004_commercial.sql", title: "Comercial", contents: "Enums lead_status, quote_status, rfq_status, urgencia. Tabelas leads, quotes, quote_items, rfqs, rfq_items, supplier_quotes com os índices parciais do Kanban e do alerta AOG.", reversible: "Sim." },
  { file: "0005_documents.sql", title: "Documentos", contents: "Enums fin_doc_status, po_status, cert_type, cert_status. estimates, invoices, invoice_items, purchase_orders, purchase_order_items, certificates, documents.", reversible: "Sim." },
  { file: "0006_operations.sql", title: "Operação", contents: "Enum logistics_status. logistics, logistics_events (append-only), stock_items.", reversible: "Sim." },
  { file: "0007_finance.sql", title: "Financeiro", contents: "Enum payment_type. payments, expenses, fx_rates. Constraint de exclusividade entre invoice_id e po_id.", reversible: "Sim." },
  { file: "0008_automation.sql", title: "Automação", contents: "ai_agents, agent_runs, automations, notifications, settings. Publicação Realtime para notifications e quotes.", reversible: "Sim." },
  { file: "0009_audit.sql", title: "Auditoria", contents: "audit.record_versions, audit.track_changes, activity_logs e o attach dos triggers nas 18 tabelas de negócio.", reversible: "Sim — perde o histórico." },
  { file: "0010_rls.sql", title: "RLS e grants", contents: "ENABLE ROW LEVEL SECURITY em tudo, REVOKE DELETE de authenticated, e as policies por papel derivadas da matriz de permissões.", reversible: "Sim, mas o rollback reabre o banco — nunca em produção." },
  { file: "0011_functions.sql", title: "RPCs de negócio", contents: "As 16 funções: conversão de lead, recálculo, precificação, escolha de fornecedor, aprovação, geração de PO, avanço de logística, pagamento, métricas e busca global.", reversible: "Sim — CREATE OR REPLACE, rollback recria a versão anterior." },
  { file: "0012_views_indexes.sql", title: "Views e índices", contents: "v_receivables, v_payables, v_aog_active, v_quote_pipeline, v_supplier_performance e os índices GIN/parciais.", reversible: "Sim." },
  { file: "0013_seed.sql", title: "Carga inicial", contents: "status_transitions completa para as 5 entidades, settings padrão (margem mínima 20%, teto de aprovação de PO, prazos de follow-up) e o registro dos 6 agentes de IA.", reversible: "Sim." },
];

// ───────────────────────── SQL ─────────────────────────

export interface SnippetDoc {
  id: string;
  title: string;
  caption: string;
  sql: string;
}

export const snippets: SnippetDoc[] = [
  {
    id: "roles",
    title: "Helpers de papel",
    caption:
      "Toda policy chama estas funções. São SECURITY DEFINER porque precisam ler user_roles ignorando a RLS da própria tabela — sem isso a policy se consultaria em loop.",
    sql: `CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.has_any_role(_roles public.app_role[])
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY(_roles)
  );
$fn$;

CREATE OR REPLACE FUNCTION app.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $fn$
  SELECT app.has_any_role(ARRAY['admin']::public.app_role[]);
$fn$;

-- Papéis com acesso a valores financeiros
CREATE OR REPLACE FUNCTION app.sees_money()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, app
AS $fn$
  SELECT app.has_any_role(ARRAY['admin','ceo','financeiro']::public.app_role[]);
$fn$;`,
  },
  {
    id: "rls",
    title: "RLS por papel",
    caption:
      "O padrão aplicado a cada tabela: leitura ampla para o escritório, escrita restrita ao papel dono do módulo, e DELETE revogado no nível do grant — arquivar é a única forma de remover.",
    sql: `ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.quotes TO authenticated;
REVOKE DELETE ON public.quotes FROM authenticated;

CREATE POLICY quotes_select ON public.quotes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY quotes_insert ON public.quotes
  FOR INSERT TO authenticated
  WITH CHECK (app.has_any_role(ARRAY['admin','ceo','comercial']::public.app_role[]));

CREATE POLICY quotes_update ON public.quotes
  FOR UPDATE TO authenticated
  USING      (app.has_any_role(ARRAY['admin','ceo','comercial']::public.app_role[]))
  WITH CHECK (app.has_any_role(ARRAY['admin','ceo','comercial']::public.app_role[]));

-- Financeiro: quem não é do dinheiro não enxerga a linha
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payments_select ON public.payments
  FOR SELECT TO authenticated
  USING (app.sees_money());

-- Operador só mexe nos próprios leads
CREATE POLICY leads_update_own ON public.leads
  FOR UPDATE TO authenticated
  USING (
    app.has_any_role(ARRAY['admin','ceo','comercial']::public.app_role[])
    OR owner_id = auth.uid()
  );`,
  },
  {
    id: "numbering",
    title: "Numeração atômica",
    caption:
      "Substitui o campo digitado à mão com placeholder COT-2026-00XX. O ON CONFLICT DO UPDATE … RETURNING resolve incremento e leitura numa única instrução, então dois usuários salvando ao mesmo tempo nunca recebem o mesmo número.",
    sql: `CREATE TABLE public.document_counters (
  doc_type    text NOT NULL,
  year        int  NOT NULL,
  last_number int  NOT NULL DEFAULT 0,
  PRIMARY KEY (doc_type, year)
);

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
$fn$;`,
  },
  {
    id: "totals",
    title: "Totais da cotação por trigger",
    caption:
      "Hoje supplier_cost e final_price são digitados e a margem real é calculada no browser, então saem do ar assim que alguém edita fora da tela de cálculo. Aqui o banco passa a ser a fonte da verdade.",
    sql: `CREATE OR REPLACE FUNCTION public.recalc_quote_totals()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  _quote_id uuid := COALESCE(NEW.quote_id, OLD.quote_id);
BEGIN
  UPDATE public.quotes q
  SET supplier_cost = t.cost,
      final_price   = t.price,
      real_margin   = CASE
        WHEN t.price > 0 THEN round(
          ((t.price - (t.cost + COALESCE(q.freight, 0) + COALESCE(q.import_fee, 0)))
           / t.price * 100)::numeric, 2)
        ELSE 0
      END
  FROM (
    SELECT COALESCE(SUM(quantity * unit_cost),  0) AS cost,
           COALESCE(SUM(quantity * unit_price), 0) AS price
    FROM public.quote_items
    WHERE quote_id = _quote_id
  ) t
  WHERE q.id = _quote_id;

  RETURN NULL;
END;
$fn$;

CREATE TRIGGER trg_quote_items_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.quote_items
  FOR EACH ROW EXECUTE FUNCTION public.recalc_quote_totals();`,
  },
  {
    id: "gate",
    title: "Portão de certificação",
    caption:
      "A regra 'nenhuma compra pode ser concluída sem certificado aprovado' hoje é um banner amarelo na tela de Compras. Aqui ela vira uma exceção do banco — nem o app, nem um script, nem o SQL editor conseguem passar por cima.",
    sql: `CREATE OR REPLACE FUNCTION public.enforce_certificate_gate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
DECLARE
  _missing int;
BEGIN
  IF NEW.status = 'liberado_logistica'
     AND OLD.status IS DISTINCT FROM NEW.status THEN

    SELECT count(*) INTO _missing
    FROM public.certificates c
    WHERE c.purchase_order_id = NEW.id
      AND c.required
      AND c.status <> 'aprovado';

    IF _missing > 0 THEN
      RAISE EXCEPTION
        'PO % nao pode ser liberada: % certificado(s) obrigatorio(s) sem aprovacao',
        NEW.po_number, _missing
        USING ERRCODE = 'check_violation',
              HINT    = 'Aprove os certificados em Certificados antes de liberar.';
    END IF;
  END IF;

  RETURN NEW;
END;
$fn$;

CREATE TRIGGER trg_po_certificate_gate
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_certificate_gate();`,
  },
  {
    id: "transitions",
    title: "Máquina de estados",
    caption:
      "As transições ficam em tabela, não em código. Isso vira uma tela editável em Configurações e impede que um card do Kanban pule de 'nova' direto para 'aprovado' — hoje o drag-and-drop aceita qualquer coluna.",
    sql: `CREATE TABLE public.status_transitions (
  entity          text NOT NULL,
  from_status     text NOT NULL,
  to_status       text NOT NULL,
  allowed_roles   public.app_role[] NOT NULL DEFAULT '{admin,ceo}',
  requires_reason boolean NOT NULL DEFAULT false,
  PRIMARY KEY (entity, from_status, to_status)
);

CREATE OR REPLACE FUNCTION public.enforce_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, app
AS $fn$
DECLARE
  _rule public.status_transitions%ROWTYPE;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT * INTO _rule
  FROM public.status_transitions
  WHERE entity = TG_ARGV[0]
    AND from_status = OLD.status::text
    AND to_status   = NEW.status::text;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transicao invalida em %: % -> %',
      TG_ARGV[0], OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;

  IF NOT app.has_any_role(_rule.allowed_roles) THEN
    RAISE EXCEPTION 'Seu perfil nao pode mover % de % para %',
      TG_ARGV[0], OLD.status, NEW.status
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$fn$;

CREATE TRIGGER trg_quotes_transition
  BEFORE UPDATE OF status ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_status_transition('quote');`,
  },
  {
    id: "audit",
    title: "Auditoria genérica",
    caption:
      "Um trigger serve as 18 tabelas. Guarda só o que mudou de fato e tira o autor do JWT, então a trilha não depende de o front lembrar de chamar logActivity().",
    sql: `CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE audit.record_versions (
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

CREATE INDEX ON audit.record_versions (table_name, record_id, at DESC);

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
    WHERE e.value IS DISTINCT FROM _old -> e.key;

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
    TG_OP, _old, _new,
    _changed, auth.uid(), auth.jwt() ->> 'email'
  );

  RETURN NULL;
END;
$fn$;`,
  },
  {
    id: "metrics",
    title: "Métricas do Dashboard",
    caption:
      "Uma chamada no lugar das 8 consultas que hoje baixam tabelas inteiras para o browser só para contar linhas. SECURITY INVOKER de propósito: a RLS continua valendo, então o operador não recebe faturamento.",
    sql: `CREATE OR REPLACE FUNCTION public.dashboard_metrics(
  _from date DEFAULT NULL,
  _to   date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $fn$
WITH per AS (
  SELECT COALESCE(_from, date_trunc('year', now())::date) AS d0,
         COALESCE(_to,   now()::date)                     AS d1
),
q AS (
  SELECT qt.* FROM public.quotes qt, per
  WHERE NOT qt.archived
    AND qt.quote_date BETWEEN per.d0 AND per.d1
),
open_q AS (
  SELECT * FROM q WHERE status NOT IN ('aprovado','perdido','cancelado')
)
SELECT jsonb_build_object(
  'open_quotes',       (SELECT count(*) FROM open_q),
  'aog_quotes',        (SELECT count(*) FROM open_q WHERE is_aog),
  'approved_quotes',   (SELECT count(*) FROM q WHERE status = 'aprovado'),
  'lost_quotes',       (SELECT count(*) FROM q WHERE status = 'perdido'),
  'avg_margin',        (SELECT round(COALESCE(avg(real_margin), 0), 1) FROM q),
  'low_margin_quotes', (SELECT count(*) FROM open_q WHERE real_margin > 0 AND real_margin < 20),
  'followups_due',     (SELECT count(*) FROM open_q WHERE followup_due_at < now()),
  'invoiced_total',    (SELECT COALESCE(sum(total), 0) FROM public.invoices
                        WHERE status <> 'cancelado' AND NOT archived),
  'receivable',        (SELECT COALESCE(sum(balance), 0) FROM public.invoices
                        WHERE status NOT IN ('pago','cancelado') AND NOT archived),
  'pending_certs',     (SELECT count(*) FROM public.certificates
                        WHERE required AND status <> 'aprovado' AND NOT archived),
  'in_transit',        (SELECT count(*) FROM public.logistics
                        WHERE status <> 'entregue' AND NOT archived),
  'late_shipments',    (SELECT count(*) FROM public.logistics
                        WHERE status <> 'entregue' AND expected_date < now()::date),
  'by_status',         (SELECT COALESCE(jsonb_object_agg(status, n), '{}'::jsonb)
                        FROM (SELECT status, count(*) AS n FROM q GROUP BY status) s),
  'sales_by_month',    (SELECT COALESCE(jsonb_agg(m ORDER BY m ->> 'month'), '[]'::jsonb)
                        FROM (
                          SELECT jsonb_build_object(
                            'month', to_char(date_trunc('month', issue_date), 'YYYY-MM'),
                            'total', sum(total)
                          ) AS m
                          FROM public.invoices
                          WHERE status <> 'cancelado' AND NOT archived
                          GROUP BY date_trunc('month', issue_date)
                        ) x)
);
$fn$;`,
  },
  {
    id: "indexes",
    title: "Índices que sustentam as telas",
    caption:
      "O banco atual não tem um índice sequer além das chaves. Cada um destes existe por causa de uma consulta concreta da interface.",
    sql: `-- Kanban de cotações: filtra por status ignorando arquivadas
CREATE INDEX idx_quotes_status
  ON public.quotes (status)
  WHERE NOT archived;

-- Faixa vermelha de AOG no Dashboard
CREATE INDEX idx_quotes_aog
  ON public.quotes (status)
  WHERE is_aog AND NOT archived;

-- Varredura de follow-up vencido (cron a cada 30 min)
CREATE INDEX idx_quotes_followup
  ON public.quotes (followup_due_at)
  WHERE status NOT IN ('aprovado','perdido','cancelado');

-- Busca por PN parcial: "3G2370" acha "3G2370A03351"
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_parts_pn_trgm
  ON public.parts USING gin (pn gin_trgm_ops);

-- Busca textual de clientes e peças
CREATE INDEX idx_customers_search ON public.customers USING gin (search_tsv);
CREATE INDEX idx_parts_search     ON public.parts     USING gin (search_tsv);

-- Contas a receber
CREATE INDEX idx_invoices_due
  ON public.invoices (due_date)
  WHERE status NOT IN ('pago','cancelado');

-- Portão de certificação
CREATE INDEX idx_certs_gate
  ON public.certificates (purchase_order_id)
  WHERE required AND status <> 'aprovado';

-- Embarques em aberto e atrasados
CREATE INDEX idx_logistics_open
  ON public.logistics (status, expected_date)
  WHERE status <> 'entregue';

-- Uma unica resposta escolhida por item de RFQ
CREATE UNIQUE INDEX idx_supplier_quotes_chosen
  ON public.supplier_quotes (rfq_item_id)
  WHERE chosen;`,
  },
];
