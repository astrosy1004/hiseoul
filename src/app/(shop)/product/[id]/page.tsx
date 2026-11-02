"use client";
import Link from "next/link";
import { use, useState } from "react";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import BottomCTA, { ctaClass } from "@/components/shop/BottomCTA";
import Price from "@/components/shop/Price";
import ProductThumb from "@/components/shop/ProductThumb";
import { StockBadge } from "@/components/shop/RankBits";
import TopBar from "@/components/shop/TopBar";
import { krw, t } from "@/lib/format";
import { fill } from "@/lib/i18n";
import { repo } from "@/lib/repo";
import { useData } from "@/lib/use-data";
import { useStore } from "@/lib/store";

const MAX_QTY = 10;

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { m, locale, currency, add, region, ready } = useStore();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { data: p, loading } = useData(() => repo.getProduct(id), [id]);
  const { data: extra } = useData(async () => {
    if (!p || !ready) return undefined;
    const [ranked, related] = await Promise.all([repo.ranking(region, p.category, 10), repo.related(p, region, 6)]);
    return { rank: ranked.find((r) => r.product.id === p.id)?.rank, related };
  }, [p, region, ready]);

  if (loading) return (<><TopBar back /><div className="mx-5 h-[300px] animate-pulse rounded-2xl bg-soft" /></>);
  if (!p || !p.visible) notFound();
  const soldOut = p.stock === "sold_out";
  const name = t(p.name, locale);

  const share = async () => {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: `${name} | HiSeoul`, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* user closed the share sheet */ }
  };
  const tags = [
    ...(p.skinTypes ?? []).map((s) => m[`skin_${s}`]),
    ...(p.concerns ?? []).map((c) => m[`concern_${c}`]),
  ];

  return (
    <>
      <TopBar back />
      <main className="flex-1 pb-6">
        <div className="relative mx-5">
          <ProductThumb product={p} className="h-[300px] w-full rounded-2xl" />
          {extra?.rank && (
            <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white">
              {fill(m.rankBadge, { rank: extra.rank, cat: m[`cat_${p.category}`] })}
            </span>
          )}
          {soldOut && <span className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-black/55 py-2 text-center text-sm font-bold text-white">{m.stock_sold_out}</span>}
        </div>
        <div className="flex flex-col gap-1.5 px-5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[13px] text-sub">{t(p.brand, locale)} · {m[`cat_${p.category}`]}</span>
            <button onClick={share} aria-label={m.share} className="-mr-2 -mt-2 flex h-10 items-center gap-1 px-2 text-xs font-semibold text-sub">
              <Icon name="share" size={18} />{copied ? m.linkCopied : m.share}
            </button>
          </div>
          <h1 className="text-[21px] font-bold leading-snug">{name}</h1>
          <span className="text-[13px] text-sub">★ {p.rating} · {fill(m.reviews, { n: p.reviewCount.toLocaleString() })}</span>
          <div className="mt-1 flex items-baseline gap-2">
            <Price krw={p.storePriceKrw} className="text-2xl font-extrabold" />
            {currency !== "KRW" && <span className="text-[13px] text-sub">{krw(p.storePriceKrw)}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-brand-soft px-2 py-1 text-xs font-semibold text-brand-ink">{m.samePrice}</span>
            <StockBadge product={p} className="!py-1 !text-xs" />
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-ink">{t(p.description, locale)}</p>

          {(tags.length > 0 || p.routineStep) && (
            <div className="mt-3 flex flex-col gap-2 rounded-xl bg-soft p-3.5 text-[13px]">
              {p.routineStep && <div className="flex gap-2"><span className="w-20 shrink-0 text-sub">{m.routineStep}</span><span className="font-semibold">{m[`step_${p.routineStep}`]}</span></div>}
              {tags.length > 0 && (
                <div className="flex gap-2"><span className="w-20 shrink-0 pt-1 text-sub">{m.goodFor}</span>
                  <div className="flex flex-wrap gap-1.5">{tags.map((x) => <span key={x} className="rounded-full bg-white px-2.5 py-1 font-semibold">{x}</span>)}</div>
                </div>
              )}
            </div>
          )}

          <div className="mt-3 flex justify-between rounded-xl border border-line px-3.5 py-3 text-[13px]">
            <span className="text-sub">{m.delivery}</span><span className="font-semibold">{soldOut ? m.restockSoon : m.tonight}</span>
          </div>
        </div>

        {extra && extra.related.length > 0 && (
          <section className="pt-7">
            <h2 className="px-5 text-base font-bold">{m.alsoBought}</h2>
            <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-5">
              {extra.related.map((r) => (
                <Link key={r.id} href={`/product/${r.id}`} className="flex w-[124px] shrink-0 flex-col gap-1">
                  <ProductThumb product={r} className="aspect-square w-full rounded-xl" />
                  <span className="line-clamp-2 text-[13px] font-semibold leading-snug">{t(r.name, locale)}</span>
                  <Price krw={r.storePriceKrw} className="text-sm font-bold" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <BottomCTA>
        <div className="flex gap-2.5">
          {!soldOut && (
            <div className="flex h-[52px] items-center rounded-xl border border-line" role="group" aria-label={m.qty}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label="-1" className="flex h-full w-11 items-center justify-center disabled:text-mute"><Icon name="minus" size={18} /></button>
              <span className="w-6 text-center text-base font-bold" aria-live="polite">{qty}</span>
              <button onClick={() => setQty(Math.min(MAX_QTY, qty + 1))} disabled={qty >= MAX_QTY} aria-label="+1" className="flex h-full w-11 items-center justify-center disabled:text-mute"><Icon name="plus" size={18} /></button>
            </div>
          )}
          <button disabled={soldOut} className={`${ctaClass} flex-1 disabled:bg-[#C9CDD2]`} onClick={() => { add(p.id, qty); setAdded(true); setQty(1); }}>
            {soldOut ? m.stock_sold_out : added ? `✓ ${m.added}` : m.addToCart}
          </button>
        </div>
      </BottomCTA>
    </>
  );
}
