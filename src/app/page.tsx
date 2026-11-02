"use client";
import Link from "next/link";
import { categories, products } from "@/lib/data";
import { useStore } from "@/lib/store";
import ProductCard from "@/components/ProductCard";

export default function Home() {
  const { t } = useStore();
  const trending = [...products].sort((a, b) => b.rankChange - a.rankChange).slice(0, 8);
  const features = [
    { icon: "🏨", title: t.f_hotel, desc: t.f_hotelDesc },
    { icon: "💸", title: t.f_tax, desc: t.f_taxDesc },
    { icon: "🧳", title: t.f_suitcase, desc: t.f_suitcaseDesc },
    { icon: "✨", title: t.f_skin, desc: t.f_skinDesc },
    { icon: "✈️", title: t.f_ship, desc: t.f_shipDesc },
  ];
  return (
    <div className="space-y-12 pt-6">
      <section className="rounded-3xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-600 p-8 text-white md:p-12">
        <h1 className="max-w-2xl text-3xl font-black leading-tight md:text-5xl">{t.tagline}</h1>
        <p className="mt-4 max-w-xl text-white/90">{t.heroSub}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/category/beauty" className="rounded-full bg-white px-5 py-2.5 font-bold text-pink-600">{t.shopNow}</Link>
          <Link href="/skin-match" className="rounded-full border border-white/70 px-5 py-2.5 font-bold">✨ {t.skinMatch}</Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">{t.categories}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className={`flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br ${c.gradient} p-5 text-white shadow-sm`}>
              <span className="text-4xl">{c.emoji}</span>
              <span className="font-bold">{t[`cat_${c.slug}`]}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold">📡 {t.trendRadar}</h2>
        <p className="mb-4 text-sm text-gray-500">{t.trendRadarSub}</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {trending.map((p, i) => <ProductCard key={p.id} p={p} rank={i + 1} />)}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">{t.why}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl bg-white p-5 ring-1 ring-pink-100">
              <div className="text-3xl">{f.icon}</div>
              <div className="mt-2 font-bold">{f.title}</div>
              <p className="mt-1 text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
