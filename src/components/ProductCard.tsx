"use client";
import Link from "next/link";
import { useState } from "react";
import { categories, formatPrice, type Product } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function ProductCard({ p, rank }: { p: Product; rank?: number }) {
  const { t, currency, add } = useStore();
  const [added, setAdded] = useState(false);
  const cat = categories.find((c) => c.slug === p.category)!;
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-pink-100 transition hover:shadow-md">
      <Link href={`/product/${p.id}`} className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${cat.gradient} text-6xl`}>
        {p.emoji}
        {rank && <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-bold text-white">#{rank}</span>}
        {p.limited && <span className="absolute right-2 top-2 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-violet-600">LIMITED</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="text-xs text-gray-500">{p.brand}</div>
        <Link href={`/product/${p.id}`} className="line-clamp-2 text-sm font-semibold">{p.name}</Link>
        <div className="text-xs text-gray-500">⭐ {p.rating} · {p.reviews.toLocaleString()} {t.reviews}</div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-bold">{formatPrice(p.priceKrw, currency)}</span>
          <button
            onClick={() => { add(p.id); setAdded(true); setTimeout(() => setAdded(false), 1200); }}
            className="rounded-full bg-pink-500 px-3 py-1 text-xs font-semibold text-white hover:bg-pink-600"
          >
            {added ? t.added : "+"}
          </button>
        </div>
      </div>
    </div>
  );
}
