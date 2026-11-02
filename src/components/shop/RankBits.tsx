"use client";
import { useStore } from "@/lib/store";
import type { Product, Region } from "@/lib/types";

export const REGIONS: Region[] = ["all", "japan", "greater_china", "sea", "americas"];

/** Region chips; the choice is remembered across pages. */
export function RegionChips({ className = "" }: { className?: string }) {
  const { m, region, setRegion } = useStore();
  return (
    <div className={`no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 ${className}`}>
      {REGIONS.map((r) => (
        <button key={r} onClick={() => setRegion(r)} aria-pressed={region === r}
          className={`h-8 shrink-0 rounded-full px-3 text-xs font-semibold ${region === r ? "bg-brand text-white" : "border border-line"}`}>{m[`region_${r}`]}</button>
      ))}
    </div>
  );
}

/** Rank movement vs yesterday. */
export function RankChange({ change, className = "" }: { change: number | "new"; className?: string }) {
  if (change === "new") return <span className={`text-[11px] font-bold text-brand ${className}`}>NEW</span>;
  if (change > 0) return <span className={`text-xs font-semibold text-[#B4410E] ${className}`} aria-label={`up ${change}`}>▲{change}</span>;
  if (change < 0) return <span className={`text-xs font-semibold text-[#1D4ED8] ${className}`} aria-label={`down ${-change}`}>▼{-change}</span>;
  return <span className={`text-xs text-mute ${className}`}>–</span>;
}

/** "Only a few left" / "Sold out today". Nothing when in stock. */
export function StockBadge({ product, className = "" }: { product: Product; className?: string }) {
  const { m } = useStore();
  if (product.stock === "in_stock") return null;
  const sold = product.stock === "sold_out";
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${sold ? "bg-[#F0F1F3] text-sub" : "bg-[#FFF4E5] text-[#8A4B08]"} ${className}`}>{sold ? m.stock_sold_out : m.stock_low}</span>;
}
