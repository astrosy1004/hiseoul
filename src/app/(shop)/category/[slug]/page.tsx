"use client";
import Link from "next/link";
import { use, useState } from "react";
import { notFound } from "next/navigation";
import BottomNav from "@/components/shop/BottomNav";
import Price from "@/components/shop/Price";
import ProductThumb from "@/components/shop/ProductThumb";
import { RankChange, RegionChips, StockBadge } from "@/components/shop/RankBits";
import TopBar from "@/components/shop/TopBar";
import { t } from "@/lib/format";
import { fill } from "@/lib/i18n";
import { repo } from "@/lib/repo";
import { useData } from "@/lib/use-data";
import { useStore } from "@/lib/store";
import type { CategorySlug, Product, SkinType } from "@/lib/types";

const CATS: CategorySlug[] = ["beauty", "kpop", "fashion"];
const SKIN: SkinType[] = ["dry", "oily", "combination", "sensitive"];

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { m, locale, region, ready } = useStore();
  const cat = slug as CategorySlug;
  const [skin, setSkin] = useState<SkinType>();
  const { data, loading } = useData(async () => {
    if (!ready) return undefined;
    const [ranked, all] = await Promise.all([repo.ranking(region, cat, 10), repo.listProducts({ category: cat })]);
    return { ranked, others: all.filter((p) => !ranked.some((r) => r.product.id === p.id)) };
  }, [cat, region, ready]);
  if (!CATS.includes(cat)) notFound();
  const fits = (p: Product) => !skin || !!p.skinTypes?.includes(skin);
  const ranked = (data?.ranked ?? []).filter((r) => fits(r.product));
  const others = (data?.others ?? []).filter(fits);
  return (
    <>
      <TopBar back title={fill(m.best, { cat: m[`cat_${cat}`] })} />
      <div className="flex gap-[18px] border-b border-line px-5 text-sm font-semibold">
        {CATS.map((c) => (
          <Link key={c} href={`/category/${c}`} replace className={`py-2.5 ${c === cat ? "border-b-2 border-brand text-brand" : "text-sub"}`}>{m[`cat_${c}`]}</Link>
        ))}
      </div>
      <div className="flex flex-col gap-2 px-5 pt-3">
        <RegionChips />
        {cat === "beauty" && (
          <div className="no-scrollbar -mx-5 flex items-center gap-1.5 overflow-x-auto px-5">
            <span className="shrink-0 text-xs font-semibold text-sub">{m.skinType}</span>
            {SKIN.map((s) => (
              <button key={s} onClick={() => setSkin(skin === s ? undefined : s)} aria-pressed={skin === s}
                className={`h-8 shrink-0 rounded-full px-3 text-xs font-semibold ${skin === s ? "bg-ink text-white" : "bg-soft text-ink"}`}>{m[`skin_${s}`]}</button>
            ))}
          </div>
        )}
        <p className="text-[13px] text-sub">{fill(m.rankingFor, { region: m[`region_${region}`] })} · {m.rankingNote}</p>
      </div>
      <main className="flex-1 px-5 pb-6 pt-3">
        {loading && !data ? (
          <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-square animate-pulse rounded-xl bg-soft" />)}</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-5">
              {ranked.map(({ product: p, rank, change }) => (
                <Card key={p.id} p={p} badge={<span className="flex items-center gap-1"><span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white">{rank}</span><span className="rounded-full bg-white/90 px-1.5"><RankChange change={change} /></span></span>} />
              ))}
            </div>
            {ranked.length === 0 && others.length === 0 && <p className="py-12 text-center text-sm text-sub">{m.noMatch}</p>}
            {others.length > 0 && (
              <>
                <h2 className="mt-8 text-base font-bold">{fill(m.moreIn, { cat: m[`cat_${cat}`] })}</h2>
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-5">{others.map((p) => <Card key={p.id} p={p} />)}</div>
              </>
            )}
          </>
        )}
      </main>
      <BottomNav />
    </>
  );
}

function Card({ p, badge }: { p: Product; badge?: React.ReactNode }) {
  const { m, locale } = useStore();
  return (
    <Link href={`/product/${p.id}`} className="flex flex-col gap-1">
      <div className="relative">
        <ProductThumb product={p} className="aspect-square w-full rounded-xl" />
        {badge && <div className="absolute left-2 top-2">{badge}</div>}
      </div>
      <span className="mt-0.5 text-xs text-sub">{t(p.brand, locale)}</span>
      <span className="line-clamp-2 text-sm font-semibold leading-snug">{t(p.name, locale)}</span>
      <Price krw={p.storePriceKrw} className="text-[15px] font-bold" />
      <span className="flex flex-wrap items-center gap-1 text-xs text-sub">★ {p.rating} · {fill(m.reviews, { n: p.reviewCount.toLocaleString() })}<StockBadge product={p} /></span>
    </Link>
  );
}
