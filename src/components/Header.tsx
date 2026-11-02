"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { langs, type Lang } from "@/lib/i18n";
import { fxRates, type Currency } from "@/lib/data";

export default function Header() {
  const { t, lang, setLang, currency, setCurrency, cart } = useStore();
  const count = cart.reduce((n, l) => n + l.qty, 0);
  return (
    <header className="sticky top-0 z-20 border-b border-pink-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="text-xl font-black tracking-tight">
          Hi<span className="text-pink-500">Seoul</span>
        </Link>
        <nav className="ml-4 hidden gap-4 text-sm font-medium text-gray-600 md:flex">
          <Link href="/category/beauty">{t.cat_beauty}</Link>
          <Link href="/category/kpop">{t.cat_kpop}</Link>
          <Link href="/category/fashion">{t.cat_fashion}</Link>
          <Link href="/skin-match" className="text-pink-600">✨ {t.f_skin}</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <select aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="rounded-lg border border-gray-200 bg-white px-2 py-1">
            {langs.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <select aria-label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="rounded-lg border border-gray-200 bg-white px-2 py-1">
            {Object.keys(fxRates).map((c) => <option key={c}>{c}</option>)}
          </select>
          <Link href="/cart" className="relative rounded-full bg-pink-500 px-3 py-1.5 font-semibold text-white">
            🛍 {t.cart}
            {count > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-violet-600 px-1.5 text-xs">{count}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
