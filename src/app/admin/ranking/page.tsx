"use client";
// Daily TOP 10 per traveler region. One list per region holds all categories;
// the app shows each category's own top 10 from it.
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { CATEGORY_KO } from "@/components/admin/ProductForm";
import ProductThumb from "@/components/shop/ProductThumb";
import { t } from "@/lib/format";
import { repo } from "@/lib/repo";
import type { Product, Region } from "@/lib/types";
import { useData } from "@/lib/use-data";

const REGION_KO: Record<Region, string> = { all: "전체", japan: "일본", greater_china: "중화권", sea: "동남아", americas: "미주·유럽" };
const btn = "h-8 w-8 rounded-lg border border-line text-sm font-bold disabled:opacity-30";

export default function AdminRanking() {
  const [region, setRegion] = useState<Region>("all");
  const [ids, setIds] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [adding, setAdding] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string }>();
  const [saving, setSaving] = useState(false);
  const { data: all = [] } = useData(() => repo.listProducts({ includeHidden: true }), []);
  const { data: saved, error } = useData(() => repo.rankingIds(region), [region]);
  useEffect(() => { if (saved) { setIds(saved); setDirty(false); } }, [saved]);

  const byId = new Map(all.map((p) => [p.id, p]));
  const list = ids.map((id) => byId.get(id)).filter((p): p is Product => !!p);
  const rest = all.filter((p) => !ids.includes(p.id));
  const edit = (next: string[]) => { setIds(next); setDirty(true); setStatus(undefined); };
  const move = (i: number, d: number) => { const n = [...ids]; [n[i], n[i + d]] = [n[i + d], n[i]]; edit(n); };
  const catRank = (p: Product) => list.filter((x) => x.category === p.category && x.visible && x.stock !== "sold_out").findIndex((x) => x.id === p.id) + 1;

  const changeRegion = (r: Region) => {
    if (dirty && !window.confirm("저장하지 않은 순서가 있어요. 버리고 다른 지역으로 갈까요?")) return;
    setRegion(r); setStatus(undefined);
  };
  const save = async () => {
    setSaving(true);
    try { await repo.saveRanking(region, ids); setDirty(false); setStatus({ ok: true, text: `${REGION_KO[region]} 순위를 저장했어요. 손님 화면에 바로 반영돼요.` }); }
    catch (e) { setStatus({ ok: false, text: `저장하지 못했어요: ${e instanceof Error ? e.message : e}` }); }
    finally { setSaving(false); }
  };

  return (
    <AdminShell>
      <div className="flex max-w-[760px] flex-col gap-5">
        <div>
          <h1 className="text-2xl font-extrabold">TOP 10 순위</h1>
          <p className="mt-1 text-[13px] text-sub">손님 국가별 오늘의 순위예요. 화살표로 순서를 바꾸고 저장하세요 · 등락(▲▼)은 지난 저장과 비교해 자동으로 계산돼요</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(REGION_KO) as Region[]).map((r) => (
            <button key={r} aria-pressed={region === r} onClick={() => changeRegion(r)} className={`h-9 rounded-full px-4 text-sm font-semibold ${region === r ? "bg-ink text-white" : "border border-line bg-white"}`}>{REGION_KO[r]}</button>
          ))}
        </div>
        {error && <p className="rounded-xl bg-[#FDECEC] px-4 py-3 text-sm text-[#B42318]">불러오지 못했어요: {error}</p>}
        <ol className="flex flex-col rounded-2xl border border-line bg-white">
          {list.map((p, i) => {
            const off = !p.visible || p.stock === "sold_out";
            const cr = catRank(p);
            return (
              <li key={p.id} className="flex items-center gap-3 border-b border-[#F0F1F3] px-4 py-2.5 last:border-0">
                <span className="w-6 text-center text-lg font-extrabold text-brand">{i + 1}</span>
                <ProductThumb product={p} className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{t(p.name, "ko")}</div>
                  <div className="text-xs text-sub">
                    {CATEGORY_KO[p.category]} {cr > 0 && cr <= 10 ? `${cr}위` : ""}
                    {off && <span className="ml-1.5 font-semibold text-[#B4410E]">{p.visible ? "품절 · 손님 화면에서 빠져요" : "앱 노출 꺼짐 · 손님 화면에서 빠져요"}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className={btn} aria-label="위로" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                  <button className={btn} aria-label="아래로" disabled={i === list.length - 1} onClick={() => move(i, 1)}>↓</button>
                  <button className={`${btn} text-sub`} aria-label="순위에서 빼기" onClick={() => edit(ids.filter((x) => x !== p.id))}>×</button>
                </div>
              </li>
            );
          })}
          {!list.length && <li className="px-4 py-8 text-center text-sm text-sub">아직 순위가 없어요. 아래에서 상품을 추가하세요.</li>}
        </ol>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="순위에 추가할 상품" value={adding} onChange={(e) => setAdding(e.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-white px-2.5 text-sm">
            <option value="">순위에 추가할 상품 고르기</option>
            {rest.map((p) => <option key={p.id} value={p.id}>[{CATEGORY_KO[p.category]}] {t(p.name, "ko")}{p.visible ? "" : " (노출 꺼짐)"}</option>)}
          </select>
          <button disabled={!adding} onClick={() => { edit([...ids, adding]); setAdding(""); }} className="h-10 rounded-lg border border-line bg-white px-4 text-sm font-semibold disabled:opacity-40">맨 아래에 추가</button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={!dirty || saving} className="h-11 rounded-xl bg-brand px-6 text-sm font-bold text-white disabled:opacity-40">{saving ? "저장 중…" : "순위 저장"}</button>
          {dirty && <span className="text-[13px] font-semibold text-[#B4410E]">저장하지 않은 변경이 있어요</span>}
          {status && <span role="status" className={`text-[13px] font-semibold ${status.ok ? "text-[#1F7A3A]" : "text-[#B42318]"}`}>{status.text}</span>}
        </div>
      </div>
    </AdminShell>
  );
}
