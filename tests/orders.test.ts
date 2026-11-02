// Sample-mode checkout (no database): same rules as create_order in schema.sql.
import { describe, expect, it } from "vitest";
import { deliveryDays } from "@/lib/delivery";
import { OrderError, repo } from "@/lib/repo";

const day = deliveryDays({ cutoffHour: 15, minLeadHours: 3 }).find((d) => d.offset === 1)!;
const base = { email: "Guest@Example.com ", guestName: "Yuki", hotelId: "h1", deliveryDate: day.date, slot: "18-21" as const, paymentMethod: "card" as const, lines: [{ productId: "b1", qty: 1 }, { productId: "b1", qty: 1 }] };

describe("checkout", () => {
  it("merges duplicate lines and prices from the catalog", async () => {
    const o = await repo.createOrder(base);
    expect(o.status).toBe("pending");
    expect(o.email).toBe("guest@example.com");
    expect(o.lines).toEqual([{ productId: "b1", qty: 2, unitPriceKrw: 21000 }]);
    expect(o.totalKrw).toBe(o.itemsKrw + o.serviceFeeKrw + o.deliveryFeeKrw);
  });

  it.each([
    ["invalid_email", { email: "nope" }],
    ["invalid_hotel", { hotelId: "zz" }],
    ["slot_closed", { deliveryDate: "2020-01-01" }],
    ["unavailable_item", { lines: [{ productId: "f3", qty: 1 }] }],
    ["invalid_qty", { lines: [{ productId: "b1", qty: 11 }] }],
  ])("rejects %s", async (code, change) => {
    await expect(repo.createOrder({ ...base, ...change })).rejects.toThrow(new OrderError(code));
  });

  it("test payment moves a pending order to paid once", async () => {
    const o = await repo.createOrder(base);
    await repo.confirmTestPayment(o.id, o.email);
    expect((await repo.lookupOrder(o.id, o.email))?.status).toBe("paid");
    await expect(repo.confirmTestPayment(o.id, o.email)).rejects.toThrow("not_pending");
  });
});
