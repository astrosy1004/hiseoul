import { describe, expect, it } from "vitest";
import { deliveryDays, seoulNow } from "@/lib/delivery";

const s = { cutoffHour: 15, minLeadHours: 3 };
// Seoul is UTC+9: 01:00Z = 10:00 KST
const at = (kstHour: number, day = "2026-11-02") => new Date(`${day}T${String(kstHour - 9 + (kstHour < 9 ? 24 : 0)).padStart(2, "0")}:00:00Z`);

describe("delivery days", () => {
  it("uses Seoul time", () => {
    expect(seoulNow(new Date("2026-11-02T16:00:00Z"))).toEqual({ date: "2026-11-03", hour: 1 });
  });

  it("offers today in the morning with only slots at least 3 hours away", () => {
    const days = deliveryDays(s, at(10));
    expect(days.map((d) => d.offset)).toEqual([0, 1, 2]);
    expect(days[0].slots.filter((x) => x.open).map((x) => x.slot)).toEqual(["15-18", "18-21", "21-23"]);
  });

  it("closes today at the cutoff hour", () => {
    const days = deliveryDays(s, at(15));
    expect(days[0].offset).toBe(1);
    expect(days).toHaveLength(2);
    expect(days[0].date).toBe("2026-11-03");
  });

  it("drops today when no slot is far enough away", () => {
    expect(deliveryDays({ cutoffHour: 23, minLeadHours: 3 }, at(19))[0].offset).toBe(1);
  });

  it("keeps the next two days fully open", () => {
    const days = deliveryDays(s, at(20));
    expect(days.every((d) => d.slots.every((x) => x.open))).toBe(true);
  });
});
