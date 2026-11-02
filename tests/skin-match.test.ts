import { describe, expect, it } from "vitest";
import { products } from "@/lib/mock-data";
import { AnswersSchema, buildRoutine } from "@/lib/skin-match";
import type { Product } from "@/lib/types";

const answers = AnswersSchema.parse({ skin: "sensitive", concerns: ["acne"], reactive: true, steps: "full", budget: "any" });

describe("skin routine", () => {
  it("picks one product per step from visible, in-stock beauty items", () => {
    const picks = buildRoutine(products, answers);
    expect(new Set(picks.map((p) => p.step)).size).toBe(picks.length);
    for (const p of picks) {
      expect(p.product.category).toBe("beauty");
      expect(p.product.visible).toBe(true);
      expect(p.product.stock).not.toBe("sold_out");
      expect(p.product.routineStep).toBe(p.step);
    }
  });

  it("never recommends hidden or sold-out products", () => {
    const hidden = products.map((p): Product => ({ ...p, visible: false }));
    expect(buildRoutine(hidden, answers)).toEqual([]);
  });

  it("simple routine has at most two steps", () => {
    expect(buildRoutine(products, { ...answers, steps: "simple" }).length).toBeLessThanOrEqual(2);
  });

  it("rejects more than two concerns", () => {
    expect(AnswersSchema.safeParse({ ...answers, concerns: ["acne", "pores", "aging"] }).success).toBe(false);
  });
});
