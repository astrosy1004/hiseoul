"use client";
import { use } from "react";
import { notFound } from "next/navigation";
import { byCategory, categories } from "@/lib/data";
import { useStore } from "@/lib/store";
import ProductCard from "@/components/ProductCard";

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t } = useStore();
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();
  const items = byCategory(slug);
  return (
    <div className="pt-6">
      <h1 className="mb-6 text-2xl font-black">{cat.emoji} {t.bestIn} {t[`cat_${cat.slug}`]}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((p, i) => <ProductCard key={p.id} p={p} rank={i + 1} />)}
      </div>
    </div>
  );
}
