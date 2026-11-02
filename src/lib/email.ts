// Guest emails (server only): order confirmed, on the way, delivered.
// Sent through Resend (resend.com) when RESEND_API_KEY and EMAIL_FROM are set.
import type { Locale, LocalizedText } from "./types";

export type MailStatus = "paid" | "delivering" | "delivered";

export interface MailOrder {
  id: string; email: string; guest_name: string; room: string | null; delivery_date: string; slot: string;
  total_krw: number; status: MailStatus; locale: Locale; handover_photo_url: string | null;
  hotel: { name: LocalizedText } | null;
  lines: { qty: number; unit_price_krw: number; name: LocalizedText }[];
}

type Copy = {
  subject: Record<MailStatus, string>; title: Record<MailStatus, string>; body: Record<MailStatus, string>;
  order: string; delivery: string; hotel: string; items: string; total: string; track: string; photo: string; footer: string;
};

const COPY: Record<Locale, Copy> = {
  en: {
    subject: { paid: "Order {id} confirmed", delivering: "Your order {id} is on its way", delivered: "Your order {id} is at the front desk" },
    title: { paid: "Thanks, {name}! Your order is confirmed.", delivering: "Your K-items are on the way.", delivered: "Delivered to your hotel!" },
    body: {
      paid: "We'll buy your items at a Seoul store and bring them to your hotel at the time below.",
      delivering: "Our courier has left with your bag. It will arrive within your delivery time.",
      delivered: "Your bag is waiting at the front desk. Give the name on your reservation to pick it up.",
    },
    order: "Order", delivery: "Delivery", hotel: "Hotel", items: "Items", total: "Total", track: "Track my order", photo: "Photo at the front desk", footer: "HiSeoul · Same-day K-shopping delivered to your hotel",
  },
  ko: {
    subject: { paid: "주문 {id} 접수 완료", delivering: "주문 {id} 배달 출발", delivered: "주문 {id} 호텔 프런트 도착" },
    title: { paid: "{name}님, 주문이 확정됐어요.", delivering: "주문하신 상품이 출발했어요.", delivered: "호텔에 도착했어요!" },
    body: {
      paid: "서울 매장에서 상품을 구매해 아래 시간에 호텔로 가져다 드려요.",
      delivering: "배달 기사가 출발했어요. 선택하신 시간 안에 도착해요.",
      delivered: "호텔 프런트에 맡겨 두었어요. 예약자 이름을 말하고 받아 가세요.",
    },
    order: "주문번호", delivery: "배달", hotel: "호텔", items: "상품", total: "합계", track: "주문 확인하기", photo: "프런트 전달 사진", footer: "하이서울 · 오늘 산 K-아이템, 오늘 호텔로",
  },
  ja: {
    subject: { paid: "ご注文 {id} を承りました", delivering: "ご注文 {id} を配達中です", delivered: "ご注文 {id} がフロントに届きました" },
    title: { paid: "{name}様、ご注文が確定しました。", delivering: "商品がホテルに向かっています。", delivered: "ホテルに届きました！" },
    body: {
      paid: "ソウルの店舗で商品を購入し、下記の時間にホテルへお届けします。",
      delivering: "配達スタッフが出発しました。ご指定の時間内にお届けします。",
      delivered: "ホテルのフロントにお預けしました。予約者名を伝えてお受け取りください。",
    },
    order: "注文番号", delivery: "お届け", hotel: "ホテル", items: "商品", total: "合計", track: "注文を確認する", photo: "フロントでの受け渡し写真", footer: "HiSeoul · 今日買ったK-アイテムを今日ホテルへ",
  },
  "zh-CN": {
    subject: { paid: "订单 {id} 已确认", delivering: "订单 {id} 正在配送", delivered: "订单 {id} 已送达酒店前台" },
    title: { paid: "{name}，您的订单已确认。", delivering: "您的商品正在路上。", delivered: "已送达酒店！" },
    body: {
      paid: "我们会在首尔门店购买商品，并在以下时间送到您的酒店。",
      delivering: "配送员已出发，将在您选择的时间内送达。",
      delivered: "包裹已寄存在酒店前台，报上预订人姓名即可领取。",
    },
    order: "订单号", delivery: "配送", hotel: "酒店", items: "商品", total: "合计", track: "查看订单", photo: "前台交接照片", footer: "HiSeoul · 今天买的韩国好物，今天送到酒店",
  },
  "zh-TW": {
    subject: { paid: "訂單 {id} 已確認", delivering: "訂單 {id} 配送中", delivered: "訂單 {id} 已送達飯店櫃檯" },
    title: { paid: "{name}，你的訂單已確認。", delivering: "你的商品正在路上。", delivered: "已送達飯店！" },
    body: {
      paid: "我們會在首爾門市購買商品，並在以下時間送到你的飯店。",
      delivering: "配送員已出發，會在你選擇的時間內送達。",
      delivered: "包裹已寄放在飯店櫃檯，報上訂房人姓名即可領取。",
    },
    order: "訂單編號", delivery: "配送", hotel: "飯店", items: "商品", total: "合計", track: "查看訂單", photo: "櫃檯交接照片", footer: "HiSeoul · 今天買的韓國好物，今天送到飯店",
  },
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
const tx = (x: LocalizedText | undefined, l: Locale) => (x ? x[l] ?? x.en : "");
const won = (n: number) => "₩" + new Intl.NumberFormat("en-US").format(n);

export function buildMail(o: MailOrder, siteUrl: string) {
  const c = COPY[o.locale] ?? COPY.en;
  const v = { id: o.id, name: o.guest_name };
  const subject = fill(c.subject[o.status], v);
  const when = `${o.delivery_date} ${o.slot.replace("-", ":00–")}:00`;
  const hotel = tx(o.hotel?.name, o.locale) + (o.room ? ` · ${o.room}` : "");
  const link = `${siteUrl}/orders/lookup?id=${encodeURIComponent(o.id)}`;
  const items = o.lines.map((l) => ({ name: tx(l.name, o.locale), qty: l.qty, price: won(l.qty * l.unit_price_krw) }));
  const photo = o.status === "delivered" && o.handover_photo_url;

  const text = [
    fill(c.title[o.status], v), c.body[o.status], "",
    `${c.order}: ${o.id}`, `${c.delivery}: ${when}`, `${c.hotel}: ${hotel}`, "",
    ...items.map((i) => `${i.name} × ${i.qty}  ${i.price}`), `${c.total}: ${won(o.total_krw)}`, "",
    ...(photo ? [`${c.photo}: ${photo}`] : []), `${c.track}: ${link}`, "", c.footer,
  ].join("\n");

  const row = (k: string, val: string) => `<tr><td style="padding:4px 0;color:#6B7280;width:96px">${esc(k)}</td><td style="padding:4px 0;font-weight:600">${esc(val)}</td></tr>`;
  const html = `<!doctype html><html lang="${o.locale}"><body style="margin:0;background:#F6F7F9;font-family:-apple-system,'Segoe UI',sans-serif;color:#111827">
<div style="max-width:520px;margin:0 auto;padding:24px 16px">
<div style="font-size:22px;font-weight:800;padding-bottom:16px">Hi<span style="color:#C2255C">Seoul</span></div>
<div style="background:#fff;border-radius:16px;padding:24px">
<h1 style="font-size:20px;margin:0 0 8px">${esc(fill(c.title[o.status], v))}</h1>
<p style="margin:0 0 16px;color:#4B5563;font-size:14px;line-height:1.5">${esc(c.body[o.status])}</p>
${photo ? `<img src="${esc(photo)}" alt="${esc(c.photo)}" width="472" style="width:100%;border-radius:12px;margin-bottom:16px">` : ""}
<table style="width:100%;font-size:14px;border-collapse:collapse">${row(c.order, o.id)}${row(c.delivery, when)}${row(c.hotel, hotel)}</table>
<hr style="border:none;border-top:1px solid #EEF0F2;margin:16px 0">
<table style="width:100%;font-size:14px;border-collapse:collapse">
${items.map((i) => `<tr><td style="padding:4px 0">${esc(i.name)} × ${i.qty}</td><td style="padding:4px 0;text-align:right">${esc(i.price)}</td></tr>`).join("")}
<tr><td style="padding:8px 0 0;font-weight:800">${esc(c.total)}</td><td style="padding:8px 0 0;text-align:right;font-weight:800">${esc(won(o.total_krw))}</td></tr>
</table>
<a href="${esc(link)}" style="display:block;margin-top:20px;background:#C2255C;color:#fff;text-align:center;padding:14px;border-radius:12px;font-weight:700;text-decoration:none">${esc(c.track)}</a>
</div>
<p style="font-size:12px;color:#9CA3AF;text-align:center;margin-top:16px">${esc(c.footer)}</p>
</div></body></html>`;
  return { subject, text, html };
}

/** Sends through Resend. Returns false when not configured or on failure. */
export async function sendMail(to: string, mail: { subject: string; text: string; html: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM;
  if (!key || !from) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: [to], ...mail }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) console.error("email:", res.status, await res.text().catch(() => ""));
    return res.ok;
  } catch (e) {
    console.error("email:", e);
    return false;
  }
}

export const emailConfigured = () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
