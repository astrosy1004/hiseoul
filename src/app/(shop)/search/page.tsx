"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import BottomNav from "@/components/shop/BottomNav";
import Price from "@/components/shop/Price";
import ProductThumb from "@/components/shop/ProductThumb";
import { StockBadge } from "@/components/shop/RankBits";
import { t } from "@/lib/format";
import { fill } from "@/lib/i18n";
import { repo } from "@/lib/repo";
import { useData } from "@/lib/use-data";
import { useStore } from "@/lib/store";

export default function SearchPage() {
  const { m, locale } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  // Wait for a short pause in typing before searching.
  useEffect(() => { const h = setTimeout(() => setQuery(q), 200); return () => clearTimeout(h); }, [q]);
  const { data: results = [], loading } = useData(() => repo.search(query), [query]);
  const { data: popular = [] } = useData(() => repo.ranking("all", undefined, 6), []);
  return (
    <>
      <header className="sticky top-0 z-20 flex items-center gap-1 bg-white px-3 py-2">
        <button onClick={() => router.back()} aria-label="Back" className="flex h-11 w-11 items-center justify-center"><Icon name="back" /></button>
        <label className="flex h-11 flex-1 items-center gap-2 rounded-xl bg-soft px-3">
          <Icon name="search" size={18} className="text-sub" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={m.searchPlaceholder} aria-label={m.search} enterKeyHint="search"
            className="h-full flex-1 bg-transparent text-[15px] outline-none" />
          {q && <button onClick={() => setQ("")} aria-label="Clear" className="text-sub"><Icon name="close" size={16} /></button>}
        </label>
      </header>
      <main className="flex-1 px-5 pb-6">
        {!query ? (
          <section className="pt-3">
            <h2 className="text-sm font-bold text-sub">{m.popularSearches}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {popular.map(({ product: p }) => (
                <button key={p.id} onClick={() => setQ(t(p.brand, locale))} className="rounded-full border border-line px-3 py-1.5 text-[13px] font-semibold">{t(p.brand, locale)}</button>
              ))}
            </div>
          </section>
        ) : results.length === 0 && !loading ? (
          <p className="py-16 text-center text-sm text-sub">{fill(m.noResults, { q: query })}</p>
        ) : (
          <ul className="pt-1">
            {results.map((p) => (
              <li key={p.id}>
                <Link href={`/product/${p.id}`} className="flex items-center gap-3 border-b border-[#F0F1F3] py-2.5">
                  <ProductThumb product={p} className="h-14 w-14 shrink-0 rounded-lg" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-xs text-sub">{t(p.brand, locale)} · {m[`cat_${p.category}`]}</span>
                    <span className="truncate text-sm font-semibold">{t(p.name, locale)}</span>
                    <div className="flex items-center gap-1.5"><Price krw={p.storePriceKrw} className="text-sm font-bold" /><StockBadge product={p} /></div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <BottomNav />
    </>
  );
}
