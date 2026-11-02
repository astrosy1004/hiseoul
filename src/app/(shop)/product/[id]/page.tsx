"use client";
import { use, useState } from "react";
import { notFound } from "next/navigation";
import BottomCTA, { ctaClass } from "@/components/shop/BottomCTA";
import Price from "@/components/shop/Price";
import ProductThumb from "@/components/shop/ProductThumb";
import TopBar from "@/components/shop/TopBar";
import { krw, t } from "@/lib/format";
import { fill } from "@/lib/i18n";
import { repo } from "@/lib/repo";
import { useData } from "@/lib/use-data";
import { useStore } from "@/lib/store";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { m, locale, currency, add } = useStore();
  const [added, setAdded] = useState(false);
  const { data: p, loading } = useData(() => repo.getProduct(id), [id]);
  if (loading) return (<><TopBar back /><div className="mx-5 h-[300px] animate-pulse rounded-2xl bg-soft" /></>);
  if (!p || !p.visible) notFound();
  return (
    <>
      <TopBar back />
      <main className="flex-1 pb-6">
        <ProductThumb product={p} className="mx-5 h-[300px] rounded-2xl" />
        <div className="flex flex-col gap-1.5 px-5 pt-5">
          <span className="text-[13px] text-sub">{t(p.brand, locale)} · {m[`cat_${p.category}`]}</span>
          <h1 className="text-[21px] font-bold leading-snug">{t(p.name, locale)}</h1>
          <span className="text-[13px] text-sub">★ {p.rating} · {fill(m.reviews, { n: p.reviewCount.toLocaleString() })}</span>
          <div className="mt-1 flex items-baseline gap-2">
            <Price krw={p.storePriceKrw} className="text-2xl font-extrabold" />
            {currency !== "KRW" && <span className="text-[13px] text-sub">{krw(p.storePriceKrw)}</span>}
          </div>
          <span className="self-start rounded-md bg-brand-soft px-2 py-1 text-xs font-semibold text-brand-ink">{m.samePrice}</span>
          <p className="mt-3 text-[15px] leading-relaxed text-ink">{t(p.description, locale)}</p>
          <div className="mt-3 flex justify-between rounded-xl border border-line px-3.5 py-3 text-[13px]">
            <span className="text-sub">{m.delivery}</span><span className="font-semibold">{m.tonight}</span>
          </div>
        </div>
      </main>
      <BottomCTA>
        <button className={ctaClass} onClick={() => { add(p.id); setAdded(true); }}>{added ? `✓ ${m.added}` : m.addToCart}</button>
      </BottomCTA>
    </>
  );
}
