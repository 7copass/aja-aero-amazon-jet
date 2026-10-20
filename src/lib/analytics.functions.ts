import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AnalyzeInput = { lang: "pt" | "en" | "es" };

const LANG_NAME: Record<string, string> = {
  pt: "português do Brasil",
  en: "English",
  es: "español",
};

export const analyzeBusinessData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: AnalyzeInput) => {
    const lang = ["pt", "en", "es"].includes(input?.lang) ? input.lang : "pt";
    return { lang } as AnalyzeInput;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const [quotes, invoices, pos, logistics, certs, suppliers, customers] = await Promise.all([
      supabase.from("quotes").select("internal_number,status,is_aog,final_price,real_margin,supplier_cost,aircraft"),
      supabase.from("invoices").select("total,status"),
      supabase.from("purchase_orders").select("status"),
      supabase.from("logistics").select("status"),
      supabase.from("certificates").select("status,cert_type"),
      supabase.from("suppliers").select("name"),
      supabase.from("customers").select("name"),
    ]);

    const q = quotes.data ?? [];
    const inv = invoices.data ?? [];

    const summary = {
      total_quotes: q.length,
      open_quotes: q.filter((x: any) => !["aprovado", "perdido", "cancelado"].includes(x.status)).length,
      aog_quotes: q.filter((x: any) => x.is_aog && !["aprovado", "perdido", "cancelado"].includes(x.status)).length,
      approved_quotes: q.filter((x: any) => x.status === "aprovado").length,
      lost_quotes: q.filter((x: any) => x.status === "perdido").length,
      avg_real_margin: q.length ? +(q.reduce((s: number, x: any) => s + Number(x.real_margin ?? 0), 0) / q.length).toFixed(1) : 0,
      total_invoiced: inv.filter((x: any) => x.status !== "cancelado").reduce((s: number, x: any) => s + Number(x.total ?? 0), 0),
      quotes_by_status: q.reduce((acc: Record<string, number>, x: any) => { acc[x.status] = (acc[x.status] ?? 0) + 1; return acc; }, {}),
      purchase_orders_by_status: (pos.data ?? []).reduce((acc: Record<string, number>, x: any) => { acc[x.status] = (acc[x.status] ?? 0) + 1; return acc; }, {}),
      logistics_by_status: (logistics.data ?? []).reduce((acc: Record<string, number>, x: any) => { acc[x.status] = (acc[x.status] ?? 0) + 1; return acc; }, {}),
      pending_certificates: (certs.data ?? []).filter((x: any) => x.status !== "aprovado").length,
      suppliers_count: (suppliers.data ?? []).length,
      customers_count: (customers.data ?? []).length,
      low_margin_quotes: q.filter((x: any) => Number(x.real_margin ?? 0) > 0 && Number(x.real_margin ?? 0) < 20).length,
    };

    const langName = LANG_NAME[data.lang] ?? LANG_NAME.pt;
    const { createAiModel } = await import("@/lib/ai-gateway.server");
    const { model } = createAiModel();

    const { text } = await generateText({
      model,
      messages: [
        {
          role: "system",
          content:
            `You are a senior business analyst for AJA Aero ERP (Amazon Jet Aviation), an aviation parts trading company. ` +
            `Analyze the provided ERP metrics and produce a concise, executive report. ` +
            `Write the ENTIRE response in ${langName}. ` +
            `Use short Markdown sections with these headings (translated to ${langName}): ` +
            `an Overview paragraph, "Highlights" (bullets), "Risks & Alerts" (bullets, mention AOG and low-margin quotes if relevant), ` +
            `and "Recommended Actions" (numbered bullets). Be specific, reference the numbers, and stay under 300 words. Do not invent data.`,
        },
        {
          role: "user",
          content: `ERP metrics (JSON):\n${JSON.stringify(summary, null, 2)}`,
        },
      ],
    });

    return { analysis: text, generatedAt: new Date().toISOString() };
  });
