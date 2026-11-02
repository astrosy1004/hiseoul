"use client";
import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import BottomNav from "@/components/shop/BottomNav";
import Price from "@/components/shop/Price";
import ProductThumb from "@/components/shop/ProductThumb";
import TopBar from "@/components/shop/TopBar";
import { SAME_DAY_CUTOFF_HOUR } from "@/lib/config";
import { t } from "@/lib/format";
import { fill } from "@/lib/i18n";
import { repo } from "@/lib/repo";
import { useData } from "@/lib/use-data";
import { useStore } from "@/lib/store";
import type { CategorySlug, Region } from "@/lib/types";

const REGIONS: Region[] = ["all", "japan", "greater_china", "sea", "americas"];
const CATS: CategorySlug[] = ["beauty", "kpop", "fashion"];

export default function Home() {
  const { m, locale } = useStore();
  const [region, setRegion] = useState<Region>(locale === "ja" ? "japan" : locale.startsWith("zh") ? "greater_china" : "all");
  const { data: items = [] } = useData(() => repo.ranking(region, undefined, 5), [region]);
  const time = locale === "ko" ? `오후 ${SAME_DAY_CUTOFF_HOUR - 12}시` : `${SAME_DAY_CUTOFF_HOUR - 12} PM`;
  return (
    <>
      <TopBar />
      <main className="flex-1 pb-4">
        <div className="mx-5 flex items-center gap-2.5 rounded-lg bg-brand-soft px-3.5 py-2.5 text-[13px] text-brand-ink">
          <Icon name="clock" size={18} /><span>{fill(m.cutoff, { time })}</span>
        </div>
        <nav className="flex gap-2 px-5 pb-1 pt-4">
          {CATS.map((c, i) => (
            <Link key={c} href={`/category/${c}`} className={`flex h-11 flex-1 items-center justify-center rounded-full text-sm font-semibold ${i === 0 ? "bg-ink text-white" : "border border-line"}`}>{m[`cat_${c}`]}</Link>
          ))}
        </nav>
        <Link href="/skin-match" className="mx-5 mt-3 flex items-center justify-between rounded-2xl bg-soft p-[18px]">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-brand">{m.skinBannerKicker}</span>
            <span className="text-[17px] font-bold">{m.skinBannerTitle}</span>
            <span className="text-[13px] text-sub">{m.skinBannerSub}</span>
          </div>
          <Icon name="chevron" />
        </Link>
        <section className="px-5 pt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold">{m.trending}</h2>
            <Link href="/category/beauty" className="text-[13px] font-semibold text-brand">{m.seeAll}</Link>
          </div>
          <div className="no-scrollbar -mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5">
            {REGIONS.map((r) => (
              <button key={r} onClick={() => setRegion(r)} className={`h-8 shrink-0 rounded-full px-3 text-xs font-semibold ${region === r ? "bg-brand text-white" : "border border-line"}`}>{m[`region_${r}`]}</button>
            ))}
          </div>
          <ol className="mt-2">
            {items.map(({ product: p, rank, change }) => (
              <li key={p.id}>
                <Link href={`/product/${p.id}`} className="flex items-center gap-3 border-b border-[#F0F1F3] py-2.5">
                  <span className="w-5 text-base font-extrabold text-brand">{rank}</span>
                  <ProductThumb product={p} className="h-14 w-14 shrink-0 rounded-lg" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-xs text-sub">{t(p.brand, locale)}</span>
                    <span className="truncate text-sm font-semibold">{t(p.name, locale)}</span>
                    <Price krw={p.storePriceKrw} className="text-sm font-bold" />
                  </div>
                  <span className="text-xs font-semibold text-[#B4410E]">{change === "new" ? "NEW" : change > 0 ? `▲ ${change}` : change < 0 ? `▼ ${-change}` : "–"}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
