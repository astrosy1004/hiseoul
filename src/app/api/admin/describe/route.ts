// POST /api/admin/describe — owner/manager only.
// Reads a package photo (and/or what the staff member typed) and drafts the
// product name, brand and a short shopper description in all five app
// languages. Nothing is saved here: the draft fills the form, a person checks
// it and presses save.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { DescribeRequest, DraftSchema } from "@/lib/product-ai";
import { requireStaff } from "@/lib/server-auth";

export const maxDuration = 60;

const SYSTEM = `You help staff of HiSeoul, a Seoul shopping and same-day hotel delivery app for foreign travelers, add products.
You get a photo of a product package and/or details the staff member typed. Produce the catalog entry.
Rules:
- Details typed by the staff member are correct; never contradict them. Use the photo for the rest.
- Read brand and product names from the package. Keep the brand's official spelling; for languages where you do not know an official name, use the Latin spelling.
- Product name: brand-free, include size/count if visible (e.g. "100ml", "70 pads"). ko in Korean, ja in Japanese, zh_CN Simplified Chinese, zh_TW Traditional Chinese (Taiwan).
- description: 1-2 short sentences a traveler would find useful (what it is, texture or key ingredient, who it suits). Natural in each language, not word-for-word.
- No medical or exaggerated claims (no "cures", "treats", "100%"). Do not invent awards, rankings or prices.
- category: beauty (skincare, makeup, hair, body), kpop (albums, light sticks, idol goods), fashion (clothes, bags, accessories).
- skinTypes / concerns / routineStep only for skincare; otherwise empty arrays and "none". routineStep: toner, essence (also serum/ampoule), cream (also lotion), sun (sunscreen) or none.
- checkNote: one short sentence in Korean telling the staff member what to double-check (for example an unreadable name, or a guessed size). Empty string if nothing.`;

export async function POST(req: Request) {
  const auth = await requireStaff(req, ["owner", "manager"]);
  if (!auth.ok) return auth.res;
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "no_ai_key" }, { status: 503 });
  const parsed = DescribeRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const { image, known } = parsed.data;
  const typed = Object.fromEntries(Object.entries(known).filter(([, v]) => v && v.trim()));
  if (!image && !typed.nameKo && !typed.nameEn) return Response.json({ error: "need_photo_or_name" }, { status: 400 });

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (image) content.push({ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } });
  content.push({ type: "text", text: `Details typed by staff (may be empty): ${JSON.stringify(typed)}` });

  try {
    const client = new Anthropic({ timeout: 50_000, maxRetries: 1 });
    const res = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 3000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(DraftSchema) },
      system: SYSTEM,
      messages: [{ role: "user", content }],
    });
    if (res.stop_reason === "refusal" || !res.parsed_output) return Response.json({ error: "ai_failed" }, { status: 502 });
    return Response.json(res.parsed_output);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return Response.json({ error: "ai_busy" }, { status: 429 });
    console.error("describe:", e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e);
    return Response.json({ error: "ai_failed" }, { status: 502 });
  }
}
