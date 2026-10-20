import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Database, Search, Copy, Check, Table2, ShieldCheck, FunctionSquare, Zap,
  GitBranch, HardDrive, KeyRound, AlertTriangle, Layers, ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/status";
import {
  layers, tables, roles, permissionMatrix, rpcs, triggers,
  edgeFunctions, buckets, migrations, snippets,
  type Maturity, type TableDoc, type Perm,
} from "@/lib/schema-docs";

export const Route = createFileRoute("/_authenticated/arquitetura")({
  component: ArquiteturaPage,
});

const maturityTone: Record<Maturity, Tone> = {
  existente: "muted",
  revisada: "warning",
  nova: "gold",
};

const maturityLabel: Record<Maturity, string> = {
  existente: "Já existe",
  revisada: "Revisada",
  nova: "Nova",
};

function CodeBlock({ sql }: { sql: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="relative">
      <Button
        size="icon"
        variant="ghost"
        onClick={copy}
        title="Copiar SQL"
        className="absolute right-2 top-2 h-7 w-7 text-primary-foreground/60 hover:bg-white/10 hover:text-primary-foreground"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
      <pre className="overflow-x-auto rounded-xl bg-navy p-4 text-[12px] leading-relaxed text-primary-foreground/85">
        <code className="font-mono">{sql}</code>
      </pre>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="font-display text-base font-bold text-foreground">{title}</h3>
      {hint && <p className="mb-3 mt-0.5 text-sm text-muted-foreground">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </div>
  );
}

/* ─────────────────────────── Visão geral ─────────────────────────── */

function OverviewTab({ onGoToTables }: { onGoToTables: (layer: string) => void }) {
  const counts = useMemo(() => ({
    total: tables.length,
    nova: tables.filter((t) => t.maturity === "nova").length,
    revisada: tables.filter((t) => t.maturity === "revisada").length,
    existente: tables.filter((t) => t.maturity === "existente").length,
  }), []);

  const gaps = [
    {
      title: "A RLS não separa ninguém",
      detail:
        "As 22 tabelas operacionais têm a mesma policy: FOR ALL TO authenticated USING (true) WITH CHECK (true). Os 7 papéis existem e a função has_role() está escrita, mas só é usada em user_roles. Na prática um operador lê faturamento, margem e a senha de portal dos fornecedores.",
      fix: "Policies por papel derivadas da matriz de permissões, DELETE revogado no grant e valores financeiros atrás de app.sees_money().",
    },
    {
      title: "Senha de fornecedor legível por todo mundo",
      detail:
        "suppliers.password_encrypted é uma coluna de texto na tabela que qualquer autenticado lê. O nome sugere criptografia que não existe.",
      fix: "Tabela supplier_credentials isolada, RLS de admin, segredo no Supabase Vault e cada leitura registrada na auditoria.",
    },
    {
      title: "Nenhuma regra de negócio vive no banco",
      detail:
        "O portão de certificação é um banner amarelo. O limite de margem de 20% está hardcoded no componente. O Kanban aceita arrastar de 'nova' direto para 'aprovado'. Tudo isso some se alguém usar o SQL editor, um script ou uma versão antiga do front.",
      fix: "Triggers de gate e de transição de status, mais status_transitions como tabela editável.",
    },
    {
      title: "Cotação sem itens",
      detail:
        "quote_items, rfq_items, supplier_quotes e purchase_order_items existem na migration e não têm uma única tela. Uma cotação é hoje um valor único, e a comparação entre fornecedores — o coração da decisão de compra — acontece fora do sistema.",
      fix: "Itens de linha com total gerado, escolha de fornecedor por item e score determinístico.",
    },
    {
      title: "Numeração digitada à mão",
      detail:
        "internal_number, po_number, rfq_number e invoice_number são campos livres, sem UNIQUE, com placeholder COT-2026-00XX. Dois comerciais criam o mesmo número sem o banco reclamar.",
      fix: "document_counters + next_document_number() atômica e constraint UNIQUE em cada documento.",
    },
    {
      title: "Câmbio guardado e nunca usado",
      detail:
        "quotes.exchange_rate tem default 5.0 e não entra em nenhuma conta. Todo o financeiro é USD, num negócio que vende no Brasil.",
      fix: "fx_rates datada, alimentada por cron, com amount_usd normalizado nos pagamentos.",
    },
    {
      title: "Auditoria que depende de boa vontade",
      detail:
        "activity_logs é preenchido por logActivity() chamado no front, dentro de um try/catch vazio. Se a chamada falhar, ninguém fica sabendo; se o desenvolvedor esquecer, a ação não é registrada.",
      fix: "Trigger genérico em audit.record_versions com diff em JSONB e autor tirado do JWT.",
    },
    {
      title: "Zero índices",
      detail:
        "Fora chaves primárias e uniques, não há um índice no banco. Hoje não dói porque as tabelas estão vazias — dói no primeiro milhar de cotações, e o Dashboard baixa 8 tabelas inteiras para o browser só para contar linhas.",
      fix: "Índices parciais para Kanban, AOG, follow-up e contas a receber; GIN de trigram para busca por PN; dashboard_metrics() em uma chamada.",
    },
  ];

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Tabelas no desenho", value: counts.total, tone: "navy" },
          { label: "Tabelas novas", value: counts.nova, tone: "gold" },
          { label: "Revisadas", value: counts.revisada, tone: "warning" },
          { label: "Mantidas como estão", value: counts.existente, tone: "muted" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-display text-[1.65rem] font-bold leading-none text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <Section
        title="As nove camadas"
        hint="Cada camada só depende das anteriores. É também a ordem das migrations."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {layers.map((l, i) => {
            const n = tables.filter((t) => t.layer === l.id).length;
            return (
              <button
                key={l.id}
                onClick={() => onGoToTables(l.id)}
                className="flex flex-col rounded-2xl border border-border/60 bg-card p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 font-mono text-[11px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <p className="font-display text-sm font-semibold text-foreground">{l.name}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {n}
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-medium text-gold-foreground">{l.tagline}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{l.description}</p>
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        title="O caminho de um pedido pelo banco"
        hint="A mesma jornada do negócio, agora dita em tabelas e funções."
      >
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex min-w-max items-center gap-2">
            {[
              { t: "leads", f: "create_quote_from_lead()" },
              { t: "quotes + quote_items", f: "recalculate_quote()" },
              { t: "rfqs + rfq_items", f: "send-rfq-email" },
              { t: "supplier_quotes", f: "score_supplier_quotes()" },
              { t: "quotes", f: "price_quote()" },
              { t: "estimates", f: "approve_quote()" },
              { t: "purchase_orders", f: "create_po_from_quote()" },
              { t: "certificates", f: "gate obrigatório" },
              { t: "logistics_events", f: "advance_logistics()" },
              { t: "invoices", f: "convert_estimate_to_invoice()" },
              { t: "payments", f: "register_payment()" },
            ].map((step, i, arr) => (
              <div key={step.t} className="flex items-center gap-2">
                <div className="w-40 rounded-xl border bg-background p-2.5">
                  <p className="font-mono text-[11px] font-semibold text-foreground">{step.t}</p>
                  <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{step.f}</p>
                </div>
                {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        title="O que o banco de hoje não resolve"
        hint="Cada item abaixo foi verificado na migration atual e no código das telas."
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {gaps.map((g) => (
            <div key={g.title} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
                <p className="font-display text-sm font-semibold text-foreground">{g.title}</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{g.detail}</p>
              <p className="mt-2.5 flex gap-1.5 border-t pt-2.5 text-xs leading-relaxed text-foreground">
                <span className="font-semibold text-success">Desenho:</span>
                <span className="text-muted-foreground">{g.fix}</span>
              </p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ─────────────────────────── Tabelas ─────────────────────────── */

function TableCard({ t }: { t: TableDoc }) {
  const [open, setOpen] = useState(false);
  const full = t.schema ? `${t.schema}.${t.name}` : `public.${t.name}`;
  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-soft">
      <button onClick={() => setOpen(!open)} className="flex w-full items-start justify-between gap-3 p-4 text-left">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">{full}</span>
            <StatusBadge label={maturityLabel[t.maturity]} tone={maturityTone[t.maturity]} />
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t.purpose}</p>
        </div>
        <span className="mt-0.5 shrink-0 text-xs text-muted-foreground">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="border-t px-4 pb-4 pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Colunas</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <tbody>
                {t.columns.map((c) => (
                  <tr key={c.name} className="border-b last:border-0">
                    <td className="py-1.5 pr-3 align-top font-mono font-medium text-foreground">{c.name}</td>
                    <td className="py-1.5 pr-3 align-top font-mono text-muted-foreground">{c.type}</td>
                    <td className="py-1.5 pr-3 align-top">
                      {c.key && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-primary">
                          {c.key}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 align-top text-muted-foreground">{c.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {t.relations && (
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Relações</p>
              <div className="flex flex-wrap gap-1.5">
                {t.relations.map((r) => (
                  <span key={r} className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{r}</span>
                ))}
              </div>
            </div>
          )}

          {t.indexes && (
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Índices</p>
              <ul className="space-y-1">
                {t.indexes.map((i) => (
                  <li key={i} className="font-mono text-[11px] text-muted-foreground">· {i}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">RLS</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{t.rls}</p>
          </div>

          {t.notes?.map((n) => (
            <p key={n} className="mt-2.5 rounded-lg border-l-2 border-gold bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              {n}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function TablesTab({ layerFilter, setLayerFilter }: { layerFilter: string; setLayerFilter: (v: string) => void }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return tables.filter((t) => {
      if (layerFilter !== "todas" && t.layer !== layerFilter) return false;
      if (!term) return true;
      return (
        t.name.toLowerCase().includes(term) ||
        t.purpose.toLowerCase().includes(term) ||
        t.columns.some((c) => c.name.toLowerCase().includes(term))
      );
    });
  }, [q, layerFilter]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar tabela ou coluna..." className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["todas", ...layers.map((l) => l.id)].map((id) => {
            const label = id === "todas" ? "Todas" : layers.find((l) => l.id === id)!.name;
            return (
              <button
                key={id}
                onClick={() => setLayerFilter(id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  layerFilter === id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">{filtered.length} tabela(s)</p>
      <div className="space-y-2.5">
        {filtered.map((t) => <TableCard key={(t.schema ?? "public") + t.name} t={t} />)}
        {filtered.length === 0 && (
          <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            Nenhuma tabela encontrada.
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Acesso ─────────────────────────── */

const permStyle: Record<Perm, string> = {
  "—": "text-muted-foreground/40",
  R: "bg-muted text-muted-foreground",
  RW: "bg-primary/10 text-primary",
  "RW+": "bg-gold/20 text-gold-foreground font-bold",
};

function AccessTab() {
  return (
    <div>
      <Section title="Os sete papéis" hint="Definidos no enum app_role. Hoje existem no banco e não mudam nada.">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((r) => (
            <div key={r.key} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-gold" />
                <p className="font-display text-sm font-semibold text-foreground">{r.label}</p>
                <span className="font-mono text-[11px] text-muted-foreground">{r.key}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{r.scope}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Matriz de permissões"
        hint="R = ler · RW = ler e escrever · RW+ = poder extra (aprovar, liberar, conceder) · — = sem acesso. Cada célula vira uma policy no arquivo 0010_rls.sql."
      >
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Módulo</th>
                {roles.map((r) => (
                  <th key={r.key} className="px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {r.label.split(" ")[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionMatrix.map((row) => (
                <tr key={row.module} className="border-b last:border-0">
                  <td className="px-4 py-2 font-medium text-foreground">{row.module}</td>
                  {roles.map((r) => {
                    const p = row.perms[r.key] ?? "—";
                    return (
                      <td key={r.key} className="px-2 py-2 text-center">
                        <span className={cn("inline-block min-w-9 rounded-md px-1.5 py-0.5 text-[11px] font-medium", permStyle[p])}>
                          {p}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {snippets.filter((s) => ["roles", "rls"].includes(s.id)).map((s) => (
        <Section key={s.id} title={s.title} hint={s.caption}>
          <CodeBlock sql={s.sql} />
        </Section>
      ))}
    </div>
  );
}

/* ─────────────────────────── Funções ─────────────────────────── */

function FunctionsTab() {
  const groups = useMemo(() => {
    const g: Record<string, typeof rpcs> = {};
    rpcs.forEach((r) => { (g[r.group] ??= []).push(r); });
    return g;
  }, []);

  return (
    <div>
      <Section
        title={`${rpcs.length} RPCs`}
        hint="Regra de negócio dentro do banco, chamada por supabase.rpc(). O que hoje é uma sequência de updates soltos no componente passa a ser uma transação única e auditável."
      >
        {Object.entries(groups).map(([group, list]) => (
          <div key={group} className="mb-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group}</p>
            <div className="space-y-2.5">
              {list.map((r) => (
                <div key={r.name} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
                  <div className="flex flex-wrap items-center gap-2">
                    <FunctionSquare className="h-4 w-4 shrink-0 text-primary" />
                    <span className="font-mono text-sm font-semibold text-foreground">{r.signature}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">→ {r.returns}</span>
                    <StatusBadge
                      label={`SECURITY ${r.security}`}
                      tone={r.security === "DEFINER" ? "warning" : "muted"}
                    />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{r.purpose}</p>
                  {r.rules && (
                    <ul className="mt-2 space-y-1">
                      {r.rules.map((x) => (
                        <li key={x} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                          <span>{x}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section
        title={`${triggers.length} triggers`}
        hint="A rede de proteção. Roda mesmo quando a alteração vem do SQL editor, de um script ou de uma versão antiga do front."
      >
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                {["Trigger", "Tabela", "Quando", "Faz o quê"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {triggers.map((t) => (
                <tr key={t.name} className="border-b last:border-0 align-top">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-foreground">{t.name}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{t.on}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">{t.when}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{t.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {snippets.filter((s) => ["numbering", "totals", "gate", "transitions", "audit", "metrics"].includes(s.id)).map((s) => (
        <Section key={s.id} title={s.title} hint={s.caption}>
          <CodeBlock sql={s.sql} />
        </Section>
      ))}
    </div>
  );
}

/* ─────────────────────────── Edge Functions ─────────────────────────── */

function EdgeTab() {
  return (
    <div>
      <Section
        title={`${edgeFunctions.length} edge functions`}
        hint="Deno no Supabase. É onde mora tudo que precisa falar com o mundo lá fora — e é o que transforma os módulos que hoje são maquete (WhatsApp, e-mail, PDF, QuickBooks, tracking) em funcionalidade real."
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {edgeFunctions.map((f) => (
            <div key={f.name} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 shrink-0 text-gold" />
                <span className="font-mono text-sm font-semibold text-foreground">{f.name}</span>
              </div>
              <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{f.trigger}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.purpose}</p>
              <p className="mt-2.5 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Escreve em:</span>{" "}
                <span className="font-mono text-[11px]">{f.writes}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {f.secrets.map((s) => (
                  <span key={s} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Storage"
        hint="Quatro buckets. O upload de certificado é hoje um botão que só mostra um toast."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {buckets.map((b) => (
            <div key={b.name} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-primary" />
                <span className="font-mono text-sm font-semibold text-foreground">{b.name}</span>
                <StatusBadge label={b.visibility} tone={b.visibility === "Privado" ? "navy" : "muted"} />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{b.limits}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{b.policy}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ─────────────────────────── Migrations ─────────────────────────── */

function MigrationsTab() {
  return (
    <div>
      <Section
        title="13 migrations, em ordem de dependência"
        hint="Cada arquivo é aplicável sozinho e não depende de nada que venha depois. A migration atual (20260624115614) vira a 0001–0009 reescritas; 0010 em diante é tudo novo."
      >
        <div className="space-y-2.5">
          {migrations.map((m, i) => (
            <div key={m.file} className="flex gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-[11px] font-bold text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-foreground">{m.file}</span>
                  <span className="text-xs font-medium text-gold-foreground">{m.title}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{m.contents}</p>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  <span className="font-semibold">Reversível:</span> {m.reversible}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Índices" hint={snippets.find((s) => s.id === "indexes")!.caption}>
        <CodeBlock sql={snippets.find((s) => s.id === "indexes")!.sql} />
      </Section>

      <Section title="Como aplicar quando decidirmos conectar">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <ol className="space-y-3 text-sm">
            {[
              ["Branch de banco", "supabase branches create para validar as 13 migrations sem tocar em produção."],
              ["Aplicar em ordem", "supabase db push. A ordem numérica é a ordem de dependência — não pular."],
              ["Rodar o seed", "0013 carrega as transições de status, os parâmetros financeiros e o registro dos agentes."],
              ["Conferir os advisors", "O Supabase aponta tabela com RLS desligada e função sem search_path fixo. A lista precisa terminar zerada."],
              ["Regerar os tipos", "supabase gen types typescript sobrescreve src/integrations/supabase/types.ts com o schema real."],
              ["Migrar as telas", "Trocar os useRows genéricos pelas RPCs onde há regra de negócio — Dashboard, precificação e mudança de status primeiro."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span>
                  <span className="font-semibold text-foreground">{t}</span>
                  <span className="text-muted-foreground"> — {d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Section>
    </div>
  );
}

/* ─────────────────────────── Página ─────────────────────────── */

function ArquiteturaPage() {
  const [tab, setTab] = useState("visao");
  const [layerFilter, setLayerFilter] = useState("todas");

  const goToTables = (layer: string) => {
    setLayerFilter(layer);
    setTab("tabelas");
  };

  return (
    <div>
      <PageHeader
        icon={Database}
        title="Arquitetura de dados"
        subtitle="Desenho-alvo do Postgres: tabelas, RLS, RPCs, triggers, edge functions e migrations"
      />

      <div className="mb-5 flex items-start gap-2 rounded-2xl border border-gold/30 bg-gold/[0.07] px-4 py-3 text-sm text-foreground">
        <Layers className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <p className="leading-relaxed">
          Especificação, não código executado. O banco atual tem 24 tabelas com RLS aberta e nenhuma regra de negócio —
          esta aba descreve para onde ele vai, marcando o que já existe, o que muda e o que nasce. As migrations reais
          só serão escritas quando decidirmos conectar.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="visao"><Layers className="mr-1.5 h-4 w-4" />Visão geral</TabsTrigger>
          <TabsTrigger value="tabelas"><Table2 className="mr-1.5 h-4 w-4" />Tabelas</TabsTrigger>
          <TabsTrigger value="acesso"><ShieldCheck className="mr-1.5 h-4 w-4" />RLS &amp; papéis</TabsTrigger>
          <TabsTrigger value="funcoes"><FunctionSquare className="mr-1.5 h-4 w-4" />RPC &amp; triggers</TabsTrigger>
          <TabsTrigger value="edge"><Zap className="mr-1.5 h-4 w-4" />Edge &amp; storage</TabsTrigger>
          <TabsTrigger value="migrations"><GitBranch className="mr-1.5 h-4 w-4" />Migrations</TabsTrigger>
        </TabsList>

        <TabsContent value="visao"><OverviewTab onGoToTables={goToTables} /></TabsContent>
        <TabsContent value="tabelas"><TablesTab layerFilter={layerFilter} setLayerFilter={setLayerFilter} /></TabsContent>
        <TabsContent value="acesso"><AccessTab /></TabsContent>
        <TabsContent value="funcoes"><FunctionsTab /></TabsContent>
        <TabsContent value="edge"><EdgeTab /></TabsContent>
        <TabsContent value="migrations"><MigrationsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
