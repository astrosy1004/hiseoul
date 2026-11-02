"use client";
import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import ProductForm, { CATEGORY_KO } from "@/components/admin/ProductForm";
import ProductThumb from "@/components/shop/ProductThumb";
import { krw, t } from "@/lib/format";
import { repo } from "@/lib/repo";
import type { CategorySlug, Product } from "@/lib/types";
import { useData } from "@/lib/use-data";

const STOCK_TONE = { in_stock: "text-[#1F7A3A]", low: "text-[#B4410E]", sold_out: "text-[#B42318]" } as const;

export default function AdminProducts() {
  const [category, setCategory] = useState<CategorySlug>("beauty");
  const [editing, setEditing] = useState<Product>();
  const [notice, setNotice] = useState("");
  const { data: rows = [], error, setData } = useData(async () => {
    const [ranked, all] = await Promise.all([repo.rankingIds("all"), repo.listProducts({ category, includeHidden: true })]);
    const pos = (id: string) => ranked.indexOf(id) + 1 || 999;
    return [...all].sort((a, b) => pos(a.id) - pos(b.id));
  }, [category]);

  const patch = async (id: string, change: Partial<Product>, write: () => Promise<void>) => {
    const before = rows;
    setData(rows.map((r) => (r.id === id ? { ...r, ...change } : r)));
    try { await write(); } catch (e) { setData(before); setNotice(`저장하지 못했어요: ${e instanceof Error ? e.message : e}`); }
  };
  const saved = (p: Product) => {
    setData(p.category !== category ? rows.filter((r) => r.id !== p.id) : rows.some((r) => r.id === p.id) ? rows.map((r) => (r.id === p.id ? p : r)) : [...rows, p]);
    setEditing(undefined);
    setNotice(`"${t(p.name, "ko")}" 저장했어요.${p.visible ? "" : " 앱 노출은 꺼져 있어요."}`);
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-extrabold">상품</h1>
          <p className="mt-1 text-[13px] text-sub">명동점 재고를 확인한 상품만 앱에 노출하세요 · 재고와 노출은 바꾸면 바로 반영돼요</p>
        </div>
        <div role="tablist" className="flex gap-1.5">
          {(Object.keys(CATEGORY_KO) as CategorySlug[]).map((c) => (
            <button key={c} role="tab" aria-selected={category === c} onClick={() => { setCategory(c); setEditing(undefined); }} className={`h-9 rounded-full px-4 text-sm font-semibold ${category === c ? "bg-ink text-white" : "border border-line bg-white text-ink"}`}>{CATEGORY_KO[c]}</button>
          ))}
        </div>
        {error && <p className="rounded-xl bg-[#FDECEC] px-4 py-3 text-sm text-[#B42318]">불러오지 못했어요: {error}</p>}
        {notice && <p role="status" className="rounded-xl bg-[#E9F6EC] px-4 py-3 text-sm text-[#1F7A3A]">{notice}</p>}
        <div className="flex flex-wrap items-start gap-5">
          <div className="min-w-0 flex-[999_1_560px] overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs text-sub"><tr className="border-b border-line">{["", "상품", "매장가", "명동점 재고", "앱 노출", ""].map((h, i) => <th key={i} className="px-3 py-3 font-bold">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className={`border-b border-[#F0F1F3] last:border-0 ${editing?.id === p.id ? "bg-brand-soft/40" : ""}`}>
                    <td className="py-2 pl-3"><ProductThumb product={p} className="h-11 w-11 rounded-lg" /></td>
                    <td className="px-3 py-2"><div className="font-semibold">{t(p.name, "ko")}</div><div className="text-xs text-sub">{t(p.brand, "ko")}</div></td>
                    <td className="px-3 py-2">{krw(p.storePriceKrw)}</td>
                    <td className="px-3 py-2">
                      <select aria-label="명동점 재고" value={p.stock} onChange={(e) => { const stock = e.target.value as Product["stock"]; patch(p.id, { stock }, () => repo.setProductStock(p.id, stock)); }} className={`h-8 rounded-lg border border-line bg-white px-1.5 text-[13px] font-bold ${STOCK_TONE[p.stock]}`}>
                        <option value="in_stock">있음</option><option value="low">적음</option><option value="sold_out">품절</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <button role="switch" aria-checked={p.visible} aria-label="앱 노출" onClick={() => patch(p.id, { visible: !p.visible }, () => repo.setProductVisible(p.id, !p.visible))} className={`relative h-[26px] w-11 rounded-full transition ${p.visible ? "bg-brand" : "bg-[#C9CDD2]"}`}>
                        <span className={`absolute top-[3px] h-5 w-5 rounded-full bg-white transition-all ${p.visible ? "left-[21px]" : "left-[3px]"}`} />
                      </button>
                    </td>
                    <td className="px-3 py-2"><button onClick={() => { setEditing(p); setNotice(""); }} className="h-8 rounded-lg border border-line px-2.5 text-xs font-semibold">수정</button></td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-sub">아직 상품이 없어요. 오른쪽에서 등록하세요.</td></tr>}
              </tbody>
            </table>
          </div>
          <ProductForm editing={editing} category={category} onSaved={saved} onCancel={() => setEditing(undefined)} />
        </div>
      </div>
    </AdminShell>
  );
}
