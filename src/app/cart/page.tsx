"use client";
import Link from "next/link";
import { formatPrice } from "@/lib/data";
import { useStore } from "@/lib/store";
import { PriceBox, SuitcaseMeter, useTotals } from "@/components/OrderSummary";

export default function CartPage() {
  const { t, cartItems, setQty, currency } = useStore();
  const { weight } = useTotals();
  if (cartItems.length === 0) {
    return (
      <div className="pt-16 text-center">
        <p className="text-gray-500">{t.emptyCart}</p>
        <Link href="/" className="mt-4 inline-block rounded-full bg-pink-500 px-5 py-2 font-bold text-white">{t.shopNow}</Link>
      </div>
    );
  }
  return (
    <div className="grid gap-6 pt-6 md:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <h1 className="text-2xl font-black">{t.cart}</h1>
        {cartItems.map(({ product: p, qty }) => (
          <div key={p.id} className="flex items-center gap-4 rounded-2xl bg-white p-3 ring-1 ring-pink-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-pink-50 text-3xl">{p.emoji}</div>
            <div className="flex-1">
              <div className="text-xs text-gray-500">{p.brand}</div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm">{formatPrice(p.priceKrw, currency)}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(p.id, qty - 1)} className="h-8 w-8 rounded-full bg-gray-100">−</button>
              <span className="w-6 text-center">{qty}</span>
              <button onClick={() => setQty(p.id, qty + 1)} className="h-8 w-8 rounded-full bg-gray-100">+</button>
            </div>
          </div>
        ))}
      </div>
      <aside className="space-y-4">
        <SuitcaseMeter weight={weight} />
        <PriceBox />
        <Link href="/checkout" className="block rounded-full bg-pink-500 py-3 text-center font-bold text-white hover:bg-pink-600">🏨 {t.checkout}</Link>
      </aside>
    </div>
  );
}
