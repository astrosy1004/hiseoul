"use client";
// Add or edit a product. A package photo (or a typed Korean name) lets AI
// draft the names and description in all five app languages; a person checks
// the draft and saves.
import { useEffect, useRef, useState } from "react";
import ProductThumb from "@/components/shop/ProductThumb";
import { blobToBase64, describeProduct, shrinkImage } from "@/lib/admin-api";
import type { Draft } from "@/lib/product-ai";
import { repo } from "@/lib/repo";
import { CONCERNS, SKIN_TYPES } from "@/lib/skin-match";
import type { CategorySlug, LocalizedText, Product } from "@/lib/types";

const LANGS = [["ko", "한국어"], ["en", "English"], ["ja", "日本語"], ["zh-CN", "简体"], ["zh-TW", "繁體"]] as const;
type Lang = (typeof LANGS)[number][0];
const SKIN_KO = { dry: "건성", oily: "지성", combination: "복합성", sensitive: "민감성" } as const;
const CONCERN_KO = { acne: "트러블", brightening: "미백·톤", aging: "탄력", pores: "모공", hydration: "보습" } as const;
const STEP_KO = { toner: "토너", essence: "에센스·세럼", cream: "크림", sun: "선크림" } as const;
export const CATEGORY_KO: Record<CategorySlug, string> = { beauty: "K-뷰티", kpop: "K-팝", fashion: "패션" };

const input = "h-10 w-full rounded-lg border border-line px-2.5 text-sm outline-none focus:border-brand";
const area = "h-20 w-full rounded-lg border border-line p-2.5 text-sm outline-none focus:border-brand";
const chip = (on: boolean) => `h-8 rounded-full border px-3 text-xs font-semibold ${on ? "border-brand bg-brand-soft text-brand-ink" : "border-line text-sub"}`;

const blank = (category: CategorySlug): Product => ({
  id: "", category, brand: { en: "" }, name: { en: "" }, description: { en: "" }, storePriceKrw: 0,
  rating: 0, reviewCount: 0, visible: false, stock: "in_stock",
});
const fromDraft = (x: Draft["name"]): LocalizedText => ({ en: x.en, ko: x.ko, ja: x.ja, "zh-CN": x.zh_CN, "zh-TW": x.zh_TW });
const newId = (c: CategorySlug) => `${c[0]}-${crypto.randomUUID().slice(0, 8)}`;

export default function ProductForm({ editing, category, onSaved, onCancel }: {
  editing?: Product; category: CategorySlug; onSaved: (p: Product) => void; onCancel: () => void;
}) {
  const [p, setP] = useState<Product>(editing ?? blank(category));
  const [lang, setLang] = useState<Lang>("ko");
  const [photo, setPhoto] = useState<{ blob: Blob; url: string }>();
  const [busy, setBusy] = useState<"" | "ai" | "save">("");
  const [msg, setMsg] = useState<{ tone: "ok" | "warn" | "err"; text: string }>();
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => { setP(editing ?? blank(category)); setPhoto(undefined); setMsg(undefined); setLang("ko"); }, [editing, category]);
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url); }, [photo]);

  const setText = (field: "brand" | "name" | "description", value: string) => setP((x) => ({ ...x, [field]: { ...x[field], [lang]: value } }));
  const toggle = <T extends string>(list: T[] | undefined, v: T) => (list?.includes(v) ? list.filter((x) => x !== v) : [...(list ?? []), v]);

  const pick = async (f?: File) => {
    if (!f) return;
    try {
      const blob = await shrinkImage(f);
      setPhoto({ blob, url: URL.createObjectURL(blob) });
      setMsg(undefined);
    } catch { setMsg({ tone: "err", text: "사진을 읽지 못했어요. JPG나 PNG로 다시 올려 주세요." }); }
  };

  const fill = async () => {
    setBusy("ai"); setMsg(undefined);
    const d = await describeProduct({
      image: photo ? { mediaType: "image/jpeg", data: await blobToBase64(photo.blob) } : undefined,
      known: { category: p.category, brandKo: p.brand.ko, brandEn: p.brand.en, nameKo: p.name.ko, nameEn: p.name.en, descriptionKo: p.description.ko },
    });
    setBusy("");
    if (typeof d === "string") return setMsg({ tone: "err", text: d });
    const beauty = d.category === "beauty";
    setP((x) => ({
      ...x, category: d.category, brand: fromDraft(d.brand), name: fromDraft(d.name), description: fromDraft(d.description),
      skinTypes: beauty ? d.skinTypes : undefined, concerns: beauty ? d.concerns : undefined,
      routineStep: beauty && d.routineStep !== "none" ? d.routineStep : undefined,
    }));
    setMsg({ tone: "warn", text: `AI가 채웠어요. 언어별로 확인한 뒤 저장하세요.${d.checkNote ? ` 확인할 점: ${d.checkNote}` : ""}` });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = [!p.brand.ko?.trim() && "브랜드(한국어)", !p.brand.en.trim() && "브랜드(English)", !p.name.ko?.trim() && "상품명(한국어)", !p.name.en.trim() && "상품명(English)", !(p.storePriceKrw > 0) && "매장가"].filter(Boolean);
    if (missing.length) return setMsg({ tone: "err", text: `다음 칸을 채워 주세요: ${missing.join(", ")}` });
    setBusy("save"); setMsg(undefined);
    try {
      const id = p.id || newId(p.category);
      const imageUrl = photo ? await repo.uploadProductImage(id, photo.blob) : p.imageUrl;
      const beauty = p.category === "beauty";
      const saved: Product = { ...p, id, imageUrl, skinTypes: beauty ? p.skinTypes : undefined, concerns: beauty ? p.concerns : undefined, routineStep: beauty ? p.routineStep : undefined };
      await repo.saveProduct(saved);
      setPhoto(undefined);
      onSaved(saved);
    } catch (err) {
      setMsg({ tone: "err", text: `저장하지 못했어요: ${err instanceof Error ? err.message : err}` });
    } finally { setBusy(""); }
  };

  const shown = photo ? { ...p, imageUrl: photo.url } : p;
  const filled = (l: Lang) => !!(p.name[l]?.trim() && p.brand[l]?.trim());
  return (
    <form onSubmit={save} className="flex w-full max-w-[400px] flex-[1_1_320px] flex-col gap-3 rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-bold">{editing ? "상품 수정" : "새 상품 등록"}</h2>
        {editing && <button type="button" onClick={onCancel} className="text-xs font-semibold text-sub underline">새 상품으로</button>}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => file.current?.click()} aria-label="패키지 사진 올리기" className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-dashed border-brand bg-brand-soft">
          {photo || p.imageUrl ? <ProductThumb product={shown} className="h-full w-full" /> : <span className="px-2 text-xs font-bold text-brand-ink">패키지 사진 올리기</span>}
        </button>
        <input ref={file} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        <div className="flex flex-1 flex-col justify-center gap-2 text-xs text-sub">
          <span>사진은 직접 찍은 것만 써 주세요. 다른 쇼핑몰 사진은 쓰면 안 돼요.</span>
          <button type="button" onClick={fill} disabled={!!busy || (!photo && !p.name.ko?.trim() && !p.name.en.trim())} className="h-9 rounded-lg bg-ink text-[13px] font-bold text-white disabled:opacity-40">
            {busy === "ai" ? "AI가 읽는 중… (10~20초)" : "AI로 이름·설명 채우기"}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <label className="flex flex-1 flex-col gap-1.5 text-[13px] font-semibold">분야
          <select className={input} value={p.category} onChange={(e) => setP({ ...p, category: e.target.value as CategorySlug })}>
            {Object.entries(CATEGORY_KO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1.5 text-[13px] font-semibold">매장가 (원)
          <input className={input} inputMode="numeric" value={p.storePriceKrw || ""} onChange={(e) => setP({ ...p, storePriceKrw: Number(e.target.value.replace(/\D/g, "").slice(0, 7)) })} placeholder="예: 18000" />
        </label>
      </div>

      <div className="flex flex-col gap-2 rounded-xl bg-soft p-3">
        <div role="tablist" className="flex flex-wrap gap-1">
          {LANGS.map(([l, label]) => (
            <button key={l} type="button" role="tab" aria-selected={lang === l} onClick={() => setLang(l)} className={`h-7 rounded-md px-2.5 text-xs font-bold ${lang === l ? "bg-white text-ink shadow-sm" : "text-sub"}`}>
              {label}{!filled(l) && <span className="ml-1 text-[#B4410E]">•</span>}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-[13px] font-semibold">브랜드<input className={input} value={p.brand[lang] ?? ""} onChange={(e) => setText("brand", e.target.value)} /></label>
        <label className="flex flex-col gap-1 text-[13px] font-semibold">상품명<input className={input} value={p.name[lang] ?? ""} onChange={(e) => setText("name", e.target.value)} /></label>
        <label className="flex flex-col gap-1 text-[13px] font-semibold">설명<textarea className={area} value={p.description[lang] ?? ""} onChange={(e) => setText("description", e.target.value)} /></label>
        <span className="text-[11px] text-sub">• 표시는 아직 비어 있는 언어예요. 비어 있으면 손님 화면에 영어로 나와요.</span>
      </div>

      {p.category === "beauty" && (
        <div className="flex flex-col gap-2 text-[13px] font-semibold">
          <span>어울리는 피부 <span className="font-normal text-sub">(Skin Match 추천에 쓰여요)</span></span>
          <div className="flex flex-wrap gap-1.5">{SKIN_TYPES.map((s) => <button key={s} type="button" aria-pressed={!!p.skinTypes?.includes(s)} onClick={() => setP({ ...p, skinTypes: toggle(p.skinTypes, s) })} className={chip(!!p.skinTypes?.includes(s))}>{SKIN_KO[s]}</button>)}</div>
          <div className="flex flex-wrap gap-1.5">{CONCERNS.map((c) => <button key={c} type="button" aria-pressed={!!p.concerns?.includes(c)} onClick={() => setP({ ...p, concerns: toggle(p.concerns, c) })} className={chip(!!p.concerns?.includes(c))}>{CONCERN_KO[c]}</button>)}</div>
          <label className="flex items-center gap-2"><span className="whitespace-nowrap">루틴 단계</span>
            <select className={`${input} w-auto`} value={p.routineStep ?? ""} onChange={(e) => setP({ ...p, routineStep: (e.target.value || undefined) as Product["routineStep"] })}>
              <option value="">해당 없음</option>
              {Object.entries(STEP_KO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-[13px]">
        <label className="flex items-center gap-1.5 font-semibold"><span className="whitespace-nowrap">명동점 재고</span>
          <select className={`${input} w-auto`} value={p.stock} onChange={(e) => setP({ ...p, stock: e.target.value as Product["stock"] })}>
            <option value="in_stock">있음</option><option value="low">적음</option><option value="sold_out">품절</option>
          </select>
        </label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={p.visible} onChange={(e) => setP({ ...p, visible: e.target.checked })} /> 재고 확인함 · 앱에 노출</label>
      </div>

      {msg && <p role="status" className={`rounded-lg px-3 py-2 text-[13px] ${msg.tone === "err" ? "bg-[#FDECEC] text-[#B42318]" : msg.tone === "warn" ? "bg-[#FFF4E5] text-[#8A4B0A]" : "bg-[#E9F6EC] text-[#1F7A3A]"}`}>{msg.text}</p>}
      <button disabled={!!busy} className="h-11 rounded-xl bg-brand text-sm font-bold text-white disabled:opacity-60">{busy === "save" ? "저장 중…" : editing ? "변경 저장" : "등록"}</button>
    </form>
  );
}
