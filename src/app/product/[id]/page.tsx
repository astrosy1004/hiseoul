"use client";
import { use, useState } from "react";
import { notFound } from "next/navigation";
import { categories, formatPrice, getProduct } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, currency, add } = useStore();
  const [added, setAdded] = useState(false);
  const p = getProduct(id);
  if (!p) notFound();
  const cat = categories.find((c) => c.slug === p.category)!;
  return (
    <div className="grid gap-8 pt-6 md:grid-cols-2">
      <div className={`flex aspect-square items-center justify-center rounded-3xl bg-gradient-to-br ${cat.gradient} text-9xl`}>{p.emoji}</div>
      <div className="space-y-4">
        <div className="text-sm text-gray-500">{p.brand} · {t[`cat_${p.category}`]}</div>
        <h1 className="text-3xl font-black">{p.name}</h1>
        <div className="text-sm text-gray-500">⭐ {p.rating} · {p.reviews.toLocaleString()} {t.reviews}</div>
        <div className="text-3xl font-bold">{formatPrice(p.priceKrw, currency)}
          {currency !== "KRW" && <span className="ml-2 text-base font-normal text-gray-400">₩{p.priceKrw.toLocaleString()}</span>}
        </div>
        <p className="text-gray-700">{p.description}</p>
        <div className="flex flex-wrap gap-2">
          {p.tags.map((tag) => <span key={tag} className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">{tag}</span>)}
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">🧳 {p.weightG}g</span>
        </div>
        <button onClick={() => { add(p.id); setAdded(true); }} className="w-full rounded-full bg-pink-500 py-3 font-bold text-white hover:bg-pink-600">
          {added ? `✓ ${t.added}` : t.addToCart}
        </button>
        <p className="text-sm text-gray-500">🏨 {t.f_hotelDesc}</p>
      </div>
    </div>
  );
}
