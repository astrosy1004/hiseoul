import { describe, expect, it } from "vitest";
import { buildMail, type MailOrder } from "@/lib/email";

const order: MailOrder = {
  id: "HS-1043", email: "a@b.co", guest_name: "<script>x</script>", room: "1203", delivery_date: "2026-11-03", slot: "18-21",
  total_krw: 46000, status: "paid", locale: "ja", handover_photo_url: "https://x/photo.jpg",
  hotel: { name: { en: "Lotte Hotel Seoul" } }, lines: [{ qty: 2, unit_price_krw: 21000, name: { en: "Essence", ja: "エッセンス" } }],
};

describe("order emails", () => {
  it("writes in the guest's language and falls back to English names", () => {
    const m = buildMail(order, "https://hiseoul.example");
    expect(m.subject).toBe("ご注文 HS-1043 を承りました");
    expect(m.text).toContain("エッセンス × 2  ₩42,000");
    expect(m.text).toContain("Lotte Hotel Seoul · 1203");
    expect(m.text).toContain("https://hiseoul.example/orders/lookup?id=HS-1043");
  });

  it("escapes guest-entered text in HTML", () => {
    const m = buildMail(order, "https://hiseoul.example");
    expect(m.html).not.toContain("<script>");
    expect(m.html).toContain("&#60;script&#62;");
  });

  it("shows the handover photo only when delivered", () => {
    expect(buildMail(order, "").html).not.toContain("photo.jpg");
    expect(buildMail({ ...order, status: "delivered", locale: "en" }, "").html).toContain("photo.jpg");
  });
});
