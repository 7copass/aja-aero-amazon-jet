import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Play, MessageCircle, Calculator, DollarSign, Plane, Crown, BrainCircuit, Sparkles, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRows } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { fmtDateTime } from "@/lib/format";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTr } from "@/lib/i18n";
import { analyzeBusinessData } from "@/lib/analytics.functions";

export const Route = createFileRoute("/_authenticated/automacoes")({
  component: AutomacoesPage,
});

const ICONS: Record<string, any> = {
  atendimento: MessageCircle, cotacao: Calculator, financeiro: DollarSign, logistica: Plane, ceo: Crown,
};

const TASKS: Record<string, Record<string, string[]>> = {
  atendimento: {
    pt: ["Lê mensagens do WhatsApp", "Identifica cliente, PN, quantidade e urgência", "Cria e qualifica o lead", "Envia resumo para a equipe"],
    en: ["Reads WhatsApp messages", "Identifies customer, PN, quantity and urgency", "Creates and qualifies the lead", "Sends a summary to the team"],
    es: ["Lee mensajes de WhatsApp", "Identifica cliente, PN, cantidad y urgencia", "Crea y califica el lead", "Envía un resumen al equipo"],
  },
  cotacao: {
    pt: ["Gera RFQ", "Sugere fornecedores", "Compara preços", "Analisa prazo, condição e certificação", "Recomenda melhor fornecedor"],
    en: ["Generates RFQ", "Suggests suppliers", "Compares prices", "Analyzes lead time, condition and certification", "Recommends the best supplier"],
    es: ["Genera RFQ", "Sugiere proveedores", "Compara precios", "Analiza plazo, condición y certificación", "Recomienda el mejor proveedor"],
  },
  financeiro: {
    pt: ["Calcula margem", "Gera Estimate e Invoice", "Alerta contas a pagar e receber"],
    en: ["Calculates margin", "Generates estimate and invoice", "Flags payables and receivables"],
    es: ["Calcula margen", "Genera estimación y factura", "Alerta cuentas por pagar y cobrar"],
  },
  logistica: {
    pt: ["Monitora tracking", "Alerta atrasos", "Confere documentação", "Atualiza o cliente"],
    en: ["Monitors tracking", "Flags delays", "Checks documentation", "Updates the customer"],
    es: ["Monitorea seguimiento", "Alerta retrasos", "Verifica documentación", "Actualiza al cliente"],
  },
  ceo: {
    pt: ["Gera resumo diário", "Mostra vendas, margens, pendências e riscos"],
    en: ["Generates a daily summary", "Shows sales, margins, pending items and risks"],
    es: ["Genera resumen diario", "Muestra ventas, márgenes, pendientes y riesgos"],
  },
};

function AutomacoesPage() {
  const { tr, lang } = useTr();
  const { data: agents = [], isLoading } = useRows<any>("ai_agents", { order: "name", ascending: true });
  const qc = useQueryClient();

  const toggle = async (id: string, enabled: boolean) => {
    await supabase.from("ai_agents").update({ enabled }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["ai_agents"] });
  };

  const run = async (a: any) => {
    await supabase.from("ai_agents").update({ last_run: new Date().toISOString() }).eq("id", a.id);
    await supabase.from("automations").insert({ agent_key: a.agent_key, title: a.name, result: "Execução simulada concluída", status: "ok" });
    qc.invalidateQueries({ queryKey: ["ai_agents"] });
    toast.success(`${a.name} (${tr("Executar agora")})`);
  };

  return (
    <div>
      <PageHeader
        icon={Bot}
        title="Automações IA"
        subtitle="Agentes inteligentes — preparados para OpenAI / Lovable AI"
      />

      <DataAnalysisAgent />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {agents.map((a) => {
          const Icon = ICONS[a.agent_key] ?? Bot;
          const tasks = TASKS[a.agent_key]?.[lang] ?? TASKS[a.agent_key]?.pt ?? [];
          return (
            <div key={a.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft transition-shadow hover:shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Icon className="h-5 w-5" /></span>
                  <div>
                    <p className="font-display font-semibold text-foreground">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.enabled ? tr("Ativo") : tr("Inativo")} · {fmtDateTime(a.last_run)}</p>
                  </div>
                </div>
                <Switch checked={a.enabled} onCheckedChange={(c) => toggle(a.id, c)} />
              </div>
              <ul className="mt-4 space-y-1.5">
                {tasks.map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" /> {t}
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => run(a)} disabled={!a.enabled}>
                <Play className="mr-1.5 h-4 w-4" /> {tr("Executar agora")}
              </Button>
            </div>
          );
        })}
        {isLoading && <p className="text-sm text-muted-foreground">{tr("Carregando...")}</p>}
      </div>
    </div>
  );
}

function DataAnalysisAgent() {
  const { tr, lang } = useTr();
  const analyze = useServerFn(analyzeBusinessData);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [at, setAt] = useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await analyze({ data: { lang } });
      setResult(res.analysis);
      setAt(res.generatedAt);
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (msg.includes("429")) toast.error(tr("Limite de uso atingido. Tente novamente em instantes."));
      else if (msg.includes("402")) toast.error(tr("Créditos de IA esgotados. Adicione créditos para continuar."));
      else toast.error(tr("Não foi possível gerar a análise. Tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gold/30 bg-gradient-navy text-primary-foreground shadow-card">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold">
            <BrainCircuit className="h-6 w-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display text-lg font-bold">{tr("Agente de Análise de Dados")}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
                <Sparkles className="h-3 w-3" /> AI
              </span>
            </div>
            <p className="text-sm text-primary-foreground/70">{tr("IA real conectada aos dados do ERP")}</p>
            <p className="mt-0.5 text-xs text-primary-foreground/50">{tr("Analisa vendas, margens, pipeline e gera insights acionáveis")}</p>
          </div>
        </div>
        <Button onClick={handleRun} disabled={loading} className="bg-gold text-gold-foreground hover:bg-gold/90 shrink-0">
          {loading
            ? <><RefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> {tr("Analisando dados...")}</>
            : <><Sparkles className="mr-1.5 h-4 w-4" /> {tr("Gerar análise")}</>}
        </Button>
      </div>

      {result && (
        <div className="border-t border-white/10 bg-card/95 p-5 text-card-foreground">
          <Markdown text={result} />
          {at && <p className="mt-3 text-[11px] text-muted-foreground">{tr("Análise gerada com inteligência artificial")} · {fmtDateTime(at)}</p>}
        </div>
      )}
    </div>
  );
}

// Minimal markdown renderer (headings, bullets, numbered, bold).
function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const renderInline = (s: string) => {
    const parts = s.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>,
    );
  };
  return (
    <div className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
      {lines.map((raw, i) => {
        const line = raw.trim();
        if (!line) return <div key={i} className="h-1.5" />;
        if (line.startsWith("### ")) return <h4 key={i} className="mt-2 font-display text-sm font-semibold text-foreground">{renderInline(line.slice(4))}</h4>;
        if (line.startsWith("## ")) return <h3 key={i} className="mt-3 font-display text-base font-bold text-foreground">{renderInline(line.slice(3))}</h3>;
        if (line.startsWith("# ")) return <h3 key={i} className="mt-3 font-display text-base font-bold text-foreground">{renderInline(line.slice(2))}</h3>;
        if (/^[-*]\s/.test(line)) return <div key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" /><span>{renderInline(line.replace(/^[-*]\s/, ""))}</span></div>;
        const num = line.match(/^(\d+)\.\s(.*)/);
        if (num) return <div key={i} className="flex gap-2"><span className="font-semibold text-gold-foreground">{num[1]}.</span><span>{renderInline(num[2])}</span></div>;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}
