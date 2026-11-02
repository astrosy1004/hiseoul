// POST /api/skin-match — writes the routine explanation with Claude.
// The routine itself is computed here with the same rules as the browser, so
// the AI can only explain products we actually picked. Without
// ANTHROPIC_API_KEY it answers 204 and the page keeps its built-in wording.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { repo } from "@/lib/repo";
import { AdviceSchema, AnswersSchema, buildRoutine, type Advice } from "@/lib/skin-match";
import { LOCALES } from "@/lib/types";

const Body = z.object({ answers: AnswersSchema, locale: z.enum(LOCALES) });
const LANGUAGE: Record<(typeof LOCALES)[number], string> = {
  en: "English", ko: "Korean", ja: "Japanese", "zh-CN": "Simplified Chinese", "zh-TW": "Traditional Chinese (Taiwan)",
};

const SYSTEM = `You are the skincare guide inside HiSeoul, a shopping app for travelers in Seoul.
A shopper answered a short skin quiz and our app already picked one product per routine step.
Explain the picks warmly and plainly, like a knowledgeable friend at a Myeongdong store.
Rules:
- Write everything in the requested language.
- Only talk about the products given; do not suggest others.
- No medical claims, no promises to cure anything; say "helps" or "suits".
- summary: 1-2 short sentences about the shopper's skin and what this routine focuses on.
- reasons: exactly one entry per product, reason is one sentence of at most 25 words.
- tips: 2 or 3 short practical tips (order of use, amount, sunscreen reapplying, patch test if reactive).`;

// Same answers → same text: keep recent results so repeat visits cost nothing.
const cache = new Map<string, Advice>();

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return new Response(null, { status: 204 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad request" }, { status: 400 });
  const { answers, locale } = parsed.data;
  const key = JSON.stringify([answers, locale]);
  const hit = cache.get(key);
  if (hit) return Response.json(hit);

  const picks = buildRoutine(await repo.listProducts({ category: "beauty" }), answers);
  if (!picks.length) return new Response(null, { status: 204 });
  const facts = {
    language: LANGUAGE[locale],
    shopper: { skinType: answers.skin, concerns: answers.concerns, reactsToNewProducts: answers.reactive, wants: answers.steps === "full" ? "full 4-step routine" : "simple 2-step routine" },
    products: picks.map((p) => ({ productId: p.product.id, step: p.step, brand: p.product.brand.en, name: p.product.name.en, description: p.product.description.en, suits: p.product.skinTypes, helpsWith: p.product.concerns })),
  };

  try {
    const client = new Anthropic({ timeout: 30_000, maxRetries: 1 });
    const res = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(AdviceSchema) },
      system: SYSTEM,
      messages: [{ role: "user", content: JSON.stringify(facts) }],
    });
    if (res.stop_reason === "refusal" || !res.parsed_output) return new Response(null, { status: 204 });
    const ids = new Set(picks.map((p) => p.product.id));
    const advice: Advice = { ...res.parsed_output, reasons: res.parsed_output.reasons.filter((r) => ids.has(r.productId)) };
    if (cache.size > 300) cache.delete(cache.keys().next().value!);
    cache.set(key, advice);
    return Response.json(advice);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) console.warn("skin-match: rate limited");
    else if (e instanceof Anthropic.APIError) console.error(`skin-match: API error ${e.status}`, e.message);
    else console.error("skin-match:", e);
    return new Response(null, { status: 204 });
  }
}
