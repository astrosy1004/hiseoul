"use client";
import { useState } from "react";
import { formatPrice, products, type Concern, type SkinType } from "@/lib/data";
import { useStore } from "@/lib/store";
import ProductCard from "@/components/ProductCard";

type Budget = "low" | "mid" | "high";
const budgetMax: Record<Budget, number> = { low: 40000, mid: 140000, high: Infinity };

// Rule-based matcher. Swap for an AI model (e.g. photo-based skin analysis) later.
function recommend(skin: SkinType, concern: Concern, budget: Budget) {
  const scored = products
    .filter((p) => p.category === "beauty" && p.skinTypes?.includes(skin))
    .map((p) => ({ p, score: (p.concerns?.includes(concern) ? 2 : 0) + p.rating }))
    .sort((a, b) => b.score - a.score);
  const picks = [];
  let spent = 0;
  for (const { p } of scored) {
    if (picks.length >= 4) break;
    if (spent + p.priceKrw <= budgetMax[budget]) { picks.push(p); spent += p.priceKrw; }
  }
  return picks;
}

export default function SkinMatch() {
  const { t, add, currency } = useStore();
  const [step, setStep] = useState(0);
  const [skin, setSkin] = useState<SkinType | null>(null);
  const [concern, setConcern] = useState<Concern | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);

  const Opt = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
    <button onClick={onClick} className={`rounded-2xl p-4 font-semibold ring-1 ${active ? "bg-pink-500 text-white ring-pink-500" : "bg-white ring-pink-100 hover:ring-pink-400"}`}>{label}</button>
  );

  if (step === 3 && skin && concern && budget) {
    const picks = recommend(skin, concern, budget);
    const sum = picks.reduce((s, p) => s + p.priceKrw, 0);
    return (
      <div className="space-y-6 pt-6">
        <h1 className="text-2xl font-black">✨ {t.yourRoutine}</h1>
        <p className="text-sm text-gray-500">{t[`skin_${skin}`]} · {t[`c_${concern}`]} · {formatPrice(sum, currency)}</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{picks.map((p, i) => <ProductCard key={p.id} p={p} rank={i + 1} />)}</div>
        <div className="flex gap-3">
          <button onClick={() => picks.forEach((p) => add(p.id))} className="rounded-full bg-pink-500 px-5 py-2.5 font-bold text-white">{t.addAll}</button>
          <button onClick={() => { setStep(0); setSkin(null); setConcern(null); setBudget(null); }} className="rounded-full px-5 py-2.5 font-bold text-pink-600 ring-1 ring-pink-300">{t.restart}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 pt-10">
      <div className="h-2 overflow-hidden rounded-full bg-pink-100"><div className="h-full bg-pink-500 transition-all" style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>
      {step === 0 && (<>
        <h1 className="text-2xl font-black">{t.q_skin}</h1>
        <div className="grid grid-cols-2 gap-3">
          {(["dry", "oily", "combination", "sensitive"] as SkinType[]).map((s) => <Opt key={s} active={skin === s} label={t[`skin_${s}`]} onClick={() => { setSkin(s); setStep(1); }} />)}
        </div>
      </>)}
      {step === 1 && (<>
        <h1 className="text-2xl font-black">{t.q_concern}</h1>
        <div className="grid grid-cols-2 gap-3">
          {(["acne", "brightening", "aging", "pores", "hydration"] as Concern[]).map((c) => <Opt key={c} active={concern === c} label={t[`c_${c}`]} onClick={() => { setConcern(c); setStep(2); }} />)}
        </div>
      </>)}
      {step === 2 && (<>
        <h1 className="text-2xl font-black">{t.q_budget}</h1>
        <div className="grid grid-cols-3 gap-3">
          {(["low", "mid", "high"] as Budget[]).map((b) => <Opt key={b} active={budget === b} label={t[`budget_${b}`]} onClick={() => { setBudget(b); setStep(3); }} />)}
        </div>
      </>)}
    </div>
  );
}
