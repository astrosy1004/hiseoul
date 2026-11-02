"use client";
import Link from "next/link";
import { use } from "react";
import { notFound } from "next/navigation";
import BottomNav from "@/components/shop/BottomNav";
import Price from "@/components/shop/Price";
import ProductThumb from "@/components/shop/ProductThumb";
import TopBar from "@/components/shop/TopBar";
import { t } from "@/lib/format";
import { fill } from "@/lib/i18n";
import { repo } from "@/lib/repo";
import { useStore } from "@/lib/store";
import type { CategorySlug } from "@/lib/types";

const CATS: CategorySlug[] = ["beauty", "kpop", "fashion"];

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { m, locale } = useStore();
  if (!CATS.includes(slug as CategorySlug)) notFound();
  const cat = slug as CategorySlug;
  const items = repo.ranking("all", cat, 10);
  return (
    <>
      <TopBar back title={fill(m.best, { cat: m[`cat_${cat}`] })} />
      <div className="flex gap-[18px] border-b border-line px-5 text-sm font-semibold">
        {CATS.map((c) => (
          <Link key={c} href={`/category/${c}`} className={`py-2.5 ${c === cat ? "border-b-2 border-brand text-brand" : "text-sub"}`}>{m[`cat_${c}`]}</Link>
        ))}
      </div>
      <p className="px-5 py-3 text-[13px] text-sub">{m.rankingNote}</p>
      <main className="grid flex-1 grid-cols-2 gap-x-3 gap-y-4 px-5 pb-6">
        {items.map(({ product: p, rank }) => (
          <Link key={p.id} href={`/product/${p.id}`} className="flex flex-col gap-1">
            <div className="relative">
              <ProductThumb product={p} className="aspect-square w-full rounded-xl" />
              <span className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white">{rank}</span>
            </div>
            <span className="text-xs text-sub">{t(p.brand, locale)}</span>
            <span className="text-sm font-semibold leading-snug">{t(p.name, locale)}</span>
            <Price krw={p.storePriceKrw} className="text-[15px] font-bold" />
            <span className="text-xs text-sub">★ {p.rating} · {m.sameDay}</span>
          </Link>
        ))}
      </main>
      <BottomNav />
    </>
  );
}
