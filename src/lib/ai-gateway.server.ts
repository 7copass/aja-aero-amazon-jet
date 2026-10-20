import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

/**
 * Provedor de IA configurável por ambiente.
 *
 *   AI_API_KEY   — chave do provedor (obrigatória)
 *   AI_BASE_URL  — endpoint compatível com OpenAI
 *                  OpenAI:     https://api.openai.com/v1        (padrão)
 *                  Anthropic:  https://api.anthropic.com/v1
 *                  OpenRouter: https://openrouter.ai/api/v1
 *                  Groq:       https://api.groq.com/openai/v1
 *   AI_MODEL     — id do modelo no provedor escolhido
 *
 * Se AI_API_KEY não estiver definida, cai no gateway da Lovable
 * (LOVABLE_API_KEY), mantendo o comportamento anterior.
 */
export function resolveAiConfig() {
  const apiKey = process.env.AI_API_KEY;
  if (apiKey) {
    return {
      kind: "generic" as const,
      apiKey,
      baseURL: process.env.AI_BASE_URL ?? "https://api.openai.com/v1",
      model: process.env.AI_MODEL ?? "gpt-4o-mini",
    };
  }
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (lovableKey) {
    return {
      kind: "lovable" as const,
      apiKey: lovableKey,
      baseURL: "https://ai.gateway.lovable.dev/v1",
      model: process.env.AI_MODEL ?? "google/gemini-3-flash-preview",
    };
  }
  return null;
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super(
      "IA não configurada. Defina AI_API_KEY (e opcionalmente AI_BASE_URL e AI_MODEL) no .env.",
    );
    this.name = "AiNotConfiguredError";
  }
}

/** Devolve { model, modelId } pronto para generateText/streamText. */
export function createAiModel() {
  const cfg = resolveAiConfig();
  if (!cfg) throw new AiNotConfiguredError();

  const provider =
    cfg.kind === "lovable"
      ? createLovableAiGatewayProvider(cfg.apiKey)
      : createOpenAICompatible({
          name: "aja-aero",
          baseURL: cfg.baseURL,
          apiKey: cfg.apiKey,
        });

  return { model: provider(cfg.model), modelId: cfg.model, provider: cfg.kind };
}

export function createLovableAiGatewayProvider(lovableApiKey: string, initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  let resolveRunId: (value: string | undefined) => void = () => {};
  let runIdResolved = false;
  const runIdReady = new Promise<string | undefined>((resolve) => {
    resolveRunId = resolve;
  });

  const publishRunId = (value?: string) => {
    const nextRunId = value?.trim() || undefined;
    if (!runId && nextRunId) runId = nextRunId;
    if (!runIdResolved) {
      runIdResolved = true;
      resolveRunId(runId);
    }
  };
  if (runId) publishRunId(runId);

  const provider = createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) {
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      }
      try {
        const response = await fetch(input, { ...init, headers });
        publishRunId(response.headers.get(LOVABLE_AIG_RUN_ID_HEADER) ?? undefined);
        return response;
      } catch (error) {
        publishRunId(undefined);
        throw error;
      }
    },
  });

  return Object.assign(provider, {
    getRunId: () => runId,
    waitForRunId: () => (runId ? Promise.resolve(runId) : runIdReady),
  });
}
