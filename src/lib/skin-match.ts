// Skin Match: turns 5 quiz answers into a K-skincare routine.
// Product picks are rule-based (same answers → same products, explainable to
// shoppers and staff). AI only writes the friendly explanation on top.
import { z } from "zod";
import type { Product, SkinConcern, SkinType } from "./types";

export const SKIN_TYPES = ["dry", "oily", "combination", "sensitive"] as const satisfies readonly SkinType[];
export const CONCERNS = ["acne", "brightening", "aging", "pores", "hydration"] as const satisfies readonly SkinConcern[];
export type Step = NonNullable<Product["routineStep"]>;
export const FULL_ROUTINE: Step[] = ["toner", "essence", "cream", "sun"];
export const SIMPLE_ROUTINE: Step[] = ["essence", "sun"];
export const BUDGET_LIMIT_KRW = 20000;

export const AnswersSchema = z.object({
  skin: z.enum(SKIN_TYPES),
  concerns: z.array(z.enum(CONCERNS)).min(1).max(2),
  reactive: z.boolean(),
  steps: z.enum(["simple", "full"]),
  budget: z.enum(["any", "under20k"]),
});
export type Answers = z.infer<typeof AnswersSchema>;

export interface Pick { step: Step; product: Product; matched: { skin: boolean; concerns: SkinConcern[] } }

function score(p: Product, a: Answers) {
  const skin = !!p.skinTypes?.includes(a.skin);
  const concerns = a.concerns.filter((c) => p.concerns?.includes(c));
  const gentle = a.reactive && !!p.skinTypes?.includes("sensitive");
  return { value: (skin ? 3 : 0) + concerns.length * 2 + (gentle ? 2 : 0) + p.rating / 5 + (p.stock === "low" ? -0.1 : 0), skin, concerns };
}

/** Best in-stock product for each routine step. Budget is relaxed for a step if nothing fits. */
export function buildRoutine(products: Product[], a: Answers): Pick[] {
  const steps = a.steps === "full" ? FULL_ROUTINE : SIMPLE_ROUTINE;
  const usable = products.filter((p) => p.visible && p.stock !== "sold_out" && p.category === "beauty");
  return steps.flatMap((step) => {
    const all = usable.filter((p) => p.routineStep === step);
    const inBudget = a.budget === "under20k" ? all.filter((p) => p.storePriceKrw <= BUDGET_LIMIT_KRW) : all;
    const pool = inBudget.length ? inBudget : all;
    const best = pool.map((p) => ({ p, s: score(p, a) })).sort((x, y) => y.s.value - x.s.value)[0];
    return best ? [{ step, product: best.p, matched: { skin: best.s.skin, concerns: best.s.concerns } }] : [];
  });
}

/** What the AI writes. */
export const AdviceSchema = z.object({
  summary: z.string(),
  tips: z.array(z.string()),
  reasons: z.array(z.object({ productId: z.string(), reason: z.string() })),
});
export type Advice = z.infer<typeof AdviceSchema>;
