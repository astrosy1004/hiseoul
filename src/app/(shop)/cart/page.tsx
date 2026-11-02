"use client";
import Link from "next/link";
import BottomCTA, { ctaClass } from "@/components/shop/BottomCTA";
import Price from "@/components/shop/Price";
import ProductThumb from "@/components/shop/ProductThumb";
import TopBar from "@/components/shop/TopBar";
import { TotalsBox } from "@/components/shop/Totals";
import { t } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function CartPage() {
  const { m, locale, cartItems, setQty } = useStore();
  const count = cartItems.reduce((n, x) => n + x.qty, 0);
  return (
    <>
      <TopBar back title={`${m.cart} (${count})`} />
      {cartItems.length === 0 ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-sub">{m.emptyCart}</p>
          <Link href="/category/beauty" className="rounded-xl bg-brand px-5 py-3 font-bold text-white">{m.shopNow}</Link>
        </main>
      ) : (
        <>
          <main className="flex-1 px-5 pb-6">
            <ul>
              {cartItems.map(({ product: p, qty }) => (
                <li key={p.id} className="flex gap-3 border-b border-[#F0F1F3] py-3.5">
                  <ProductThumb product={p} className="h-[72px] w-[72px] shrink-0 rounded-lg" />
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-xs text-sub">{t(p.brand, locale)}</span>
                    <span className="text-sm font-semibold">{t(p.name, locale)}</span>
                    <div className="mt-1.5 flex items-center justify-between">
                      <Price krw={p.storePriceKrw} className="text-[15px] font-bold" />
                      <div className="flex items-center rounded-lg border border-line">
                        <button aria-label="-" onClick={() => setQty(p.id, qty - 1)} className="h-9 w-9">−</button>
                        <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                        <button aria-label="+" onClick={() => setQty(p.id, qty + 1)} className="h-9 w-9">+</button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4"><TotalsBox /></div>
          </main>
          <BottomCTA><Link href="/checkout" className={ctaClass}>{m.deliverToHotel}</Link></BottomCTA>
        </>
      )}
    </>
  );
}
