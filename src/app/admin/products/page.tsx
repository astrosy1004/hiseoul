"use client";
import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { krw, t } from "@/lib/format";
import { repo } from "@/lib/repo";
import type { Product } from "@/lib/types";

const STOCK = { in_stock: ["있음", "text-[#1F7A3A]"], low: ["적음", "text-[#B4410E]"], sold_out: ["품절", "text-[#B42318]"] } as const;
const input = "h-10 w-full rounded-lg border border-line px-2.5 text-sm outline-none focus:border-brand";

export default function AdminProducts() {
  const [rows, setRows] = useState<Product[]>(() => {
    const ranked = repo.ranking("all", "beauty", 10).map((r) => r.product.id);
    const all = repo.listProducts({ category: "beauty", includeHidden: true });
    return [...all].sort((a, b) => (ranked.indexOf(a.id) + 1 || 99) - (ranked.indexOf(b.id) + 1 || 99));
  });
  const toggle = (id: string) => setRows((rs) => rs.map((r) => r.id === id ? { ...r, visible: !r.visible } : r));
  return (
    <AdminShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">K-뷰티 TOP 10</h1>
            <p className="mt-1 text-[13px] text-sub">명동점 재고를 확인한 상품만 앱에 노출돼요</p>
          </div>
          <button className="h-11 rounded-xl bg-brand px-4 text-sm font-bold text-white">앱에 반영하기</button>
        </div>
        <div className="flex flex-wrap items-start gap-5">
          <div className="min-w-0 flex-[999_1_560px] overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="text-left text-xs text-sub"><tr className="border-b border-line">{["순위", "상품", "매장가", "명동점 재고", "앱 노출"].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((p, i) => (
                  <tr key={p.id} className="border-b border-[#F0F1F3] last:border-0">
                    <td className="px-4 py-2.5 font-extrabold text-brand">{i + 1}</td>
                    <td className="px-4 py-2.5"><div className="font-semibold">{t(p.name, "ko")}</div><div className="text-xs text-sub">{t(p.brand, "ko")}</div></td>
                    <td className="px-4 py-2.5">{krw(p.storePriceKrw)}</td>
                    <td className={`px-4 py-2.5 text-[13px] font-bold ${STOCK[p.stock][1]}`}>{STOCK[p.stock][0]}</td>
                    <td className="px-4 py-2.5">
                      <button role="switch" aria-checked={p.visible} aria-label="앱 노출" onClick={() => toggle(p.id)} className={`relative h-[26px] w-11 rounded-full transition ${p.visible ? "bg-brand" : "bg-[#C9CDD2]"}`}>
                        <span className={`absolute top-[3px] h-5 w-5 rounded-full bg-white transition-all ${p.visible ? "left-[21px]" : "left-[3px]"}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form className="flex w-full max-w-[360px] flex-[1_1_300px] flex-col gap-3 rounded-2xl border border-line bg-white p-5" onSubmit={(e) => e.preventDefault()}>
            <h2 className="text-[17px] font-bold">상품 등록</h2>
            <div className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-brand bg-brand-soft px-3 text-center">
              <span className="text-sm font-bold text-brand-ink">패키지 사진 올리기</span>
              <span className="text-xs text-[#6B3A4C]">6단계: AI가 상품명·성분을 읽고 아래 칸을 채워요</span>
            </div>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">상품명 (한국어)<input className={input} /></label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1.5 text-[13px] font-semibold">브랜드<input className={input} /></label>
              <label className="flex flex-1 flex-col gap-1.5 text-[13px] font-semibold">매장가 (원)<input className={input} inputMode="numeric" /></label>
            </div>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">외국어 상품명
              <input className={input} placeholder="English" /><input className={input} placeholder="日本語" /><input className={input} placeholder="简体中文 / 繁體中文" />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">상품 설명<textarea className="h-20 rounded-lg border border-line p-2.5 text-sm outline-none focus:border-brand" /></label>
            <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" /> 명동점 재고 확인함</label>
            <button className="h-11 rounded-xl bg-ink text-sm font-bold text-white">등록</button>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
