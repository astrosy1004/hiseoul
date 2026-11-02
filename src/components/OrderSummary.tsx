"use client";
import { estimateTaxRefund, formatPrice, LUGGAGE_ALLOWANCE_G } from "@/lib/data";
import { useStore } from "@/lib/store";

export function useTotals() {
  const { cartItems } = useStore();
  const subtotal = cartItems.reduce((s, i) => s + i.product.priceKrw * i.qty, 0);
  const weight = cartItems.reduce((s, i) => s + i.product.weightG * i.qty, 0);
  const refund = estimateTaxRefund(subtotal);
  const delivery = subtotal >= 50000 || subtotal === 0 ? 0 : 5000;
  return { subtotal, weight, refund, delivery, total: subtotal + delivery - refund };
}

export function SuitcaseMeter({ weight }: { weight: number }) {
  const { t } = useStore();
  const pct = Math.min(100, (weight / LUGGAGE_ALLOWANCE_G) * 100);
  const color = pct < 60 ? "bg-emerald-500" : pct < 90 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-pink-100">
      <div className="flex justify-between text-sm font-semibold">
        <span>🧳 {t.suitcase}</span>
        <span>{(weight / 1000).toFixed(1)} / {LUGGAGE_ALLOWANCE_G / 1000} kg</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      {pct >= 90 && <p className="mt-2 text-xs text-red-600">{t.suitcaseWarn}</p>}
    </div>
  );
}

export function PriceBox() {
  const { t, currency } = useStore();
  const { subtotal, refund, delivery, total } = useTotals();
  const row = (label: string, v: string, cls = "") => (
    <div className={`flex justify-between ${cls}`}><span>{label}</span><span>{v}</span></div>
  );
  return (
    <div className="space-y-2 rounded-2xl bg-white p-4 text-sm ring-1 ring-pink-100">
      {row(t.subtotal, formatPrice(subtotal, currency))}
      {row(t.deliveryFee, delivery === 0 ? t.free : formatPrice(delivery, currency))}
      {row(`💸 ${t.taxRefund}`, `- ${formatPrice(refund, currency)}`, "text-emerald-600")}
      <hr className="border-pink-100" />
      {row(t.total, formatPrice(total, currency), "text-lg font-bold")}
    </div>
  );
}
