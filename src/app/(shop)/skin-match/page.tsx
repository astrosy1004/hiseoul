"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/Icon";
import BottomNav from "@/components/shop/BottomNav";
import BottomCTA, { ctaClass } from "@/components/shop/BottomCTA";
import Price from "@/components/shop/Price";
import ProductThumb from "@/components/shop/ProductThumb";
import TopBar from "@/components/shop/TopBar";
import { price, t } from "@/lib/format";
import { fill, type Messages } from "@/lib/i18n";
import { repo } from "@/lib/repo";
import { makeShareImage } from "@/lib/share-image";
import { AnswersSchema, BUDGET_LIMIT_KRW, buildRoutine, CONCERNS, SKIN_TYPES, type Advice, type Answers, type Pick } from "@/lib/skin-match";
import { useStore } from "@/lib/store";
import { useData } from "@/lib/use-data";

const SAVED = "hs.skin";
type Draft = Partial<Answers>;

export default function SkinMatch() {
  const { m, ready } = useStore();
  const [q, setQ] = useState(-1); // -1 intro, 0..4 questions, 5 result
  const [draft, setDraft] = useState<Draft>({ concerns: [] });

  // Coming back later shows the last result straight away.
  useEffect(() => {
    if (!ready) return;
    try {
      const saved = AnswersSchema.safeParse(JSON.parse(localStorage.getItem(SAVED) ?? "null"));
      if (saved.success) { setDraft(saved.data); setQ(5); }
    } catch { /* ignore */ }
  }, [ready]);

  const finish = (a: Answers) => {
    try { localStorage.setItem(SAVED, JSON.stringify(a)); } catch { /* ignore */ }
    setDraft(a); setQ(5);
  };
  const restart = () => { try { localStorage.removeItem(SAVED); } catch { /* ignore */ } setDraft({ concerns: [] }); setQ(0); };

  if (q === 5) {
    const a = AnswersSchema.safeParse(draft);
    if (a.success) return <Result answers={a.data} onRetake={restart} />;
  }
  return (
    <>
      <TopBar title={m.nav_skin} />
      {q < 0 ? <Intro m={m} onStart={() => setQ(0)} /> : <Quiz q={q} setQ={setQ} draft={draft} setDraft={setDraft} onDone={finish} />}
      <BottomNav />
    </>
  );
}

function Intro({ m, onStart }: { m: Messages; onStart: () => void }) {
  return (
    <main className="flex flex-1 flex-col justify-center gap-3 px-6 pb-10">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand"><Icon name="face" size={30} /></span>
      <span className="text-xs font-bold text-brand">{m.skinBannerKicker}</span>
      <h1 className="text-[26px] font-extrabold leading-snug">{m.skinBannerTitle}</h1>
      <p className="text-[15px] text-sub">{m.quizIntro}</p>
      <button onClick={onStart} className={`${ctaClass} mt-4`}>{m.startQuiz}</button>
    </main>
  );
}

function Quiz({ q, setQ, draft, setDraft, onDone }: {
  q: number; setQ: (n: number) => void; draft: Draft; setDraft: (d: Draft) => void; onDone: (a: Answers) => void;
}) {
  const { m, currency, locale } = useStore();
  const next = (d: Draft) => {
    setDraft(d);
    if (q < 4) setQ(q + 1);
    else { const a = AnswersSchema.safeParse(d); if (a.success) onDone(a.data); }
  };
  const concerns = draft.concerns ?? [];
  const option = (on: boolean) => `flex min-h-[56px] w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-[15px] font-semibold ${on ? "border-brand bg-brand-soft text-brand-ink" : "border-line"}`;

  const questions = [
    { title: m.q_skin, body: SKIN_TYPES.map((s) => (
      <button key={s} onClick={() => next({ ...draft, skin: s })} className={option(draft.skin === s)}>
        <span>{m[`a_${s}`]}<span className="block text-xs font-normal text-sub">{m[`skin_${s}`]}</span></span>
      </button>)) },
    { title: m.q_concerns, hint: m.q_concernsHint, body: CONCERNS.map((c) => {
      const on = concerns.includes(c);
      return (
        <button key={c} aria-pressed={on} onClick={() => setDraft({ ...draft, concerns: on ? concerns.filter((x) => x !== c) : [...concerns, c].slice(-2) })} className={option(on)}>
          {m[`concern_${c}`]}{on && <span aria-hidden>✓</span>}
        </button>);
    }) },
    { title: m.q_reactive, body: [true, false].map((v) => (
      <button key={String(v)} onClick={() => next({ ...draft, reactive: v })} className={option(draft.reactive === v)}>{v ? m.yes : m.no}</button>)) },
    { title: m.q_steps, body: (["simple", "full"] as const).map((v) => (
      <button key={v} onClick={() => next({ ...draft, steps: v })} className={option(draft.steps === v)}>{v === "simple" ? m.a_simple : m.a_full}</button>)) },
    { title: m.q_budget, body: (["any", "under20k"] as const).map((v) => (
      <button key={v} onClick={() => next({ ...draft, budget: v })} className={option(draft.budget === v)}>
        {v === "any" ? m.a_any : fill(m.a_under, { price: price(BUDGET_LIMIT_KRW, currency, locale) })}
      </button>)) },
  ];
  const cur = questions[q];
  return (
    <main className="flex flex-1 flex-col gap-5 px-5 pb-6 pt-2">
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${((q + 1) / 5) * 100}%` }} /></div>
        <span className="text-xs font-semibold text-sub">{fill(m.quizStep, { n: q + 1 })}</span>
      </div>
      <div>
        <h1 className="text-[22px] font-extrabold leading-snug">{cur.title}</h1>
        {cur.hint && <p className="mt-1 text-[13px] text-sub">{cur.hint}</p>}
      </div>
      <div className="flex flex-col gap-2.5">{cur.body}</div>
      <div className="mt-auto flex gap-2.5">
        {q > 0 && <button onClick={() => setQ(q - 1)} className="h-[52px] flex-1 rounded-xl border border-line text-[15px] font-semibold text-sub">{m.prev}</button>}
        {q === 1 && <button disabled={!concerns.length} onClick={() => next(draft)} className={`${ctaClass} !w-auto flex-[2]`}>{m.next}</button>}
      </div>
    </main>
  );
}

function Result({ answers, onRetake }: { answers: Answers; onRetake: () => void }) {
  const { m, locale, currency, add } = useStore();
  const [added, setAdded] = useState(false);
  const [sharing, setSharing] = useState(false);
  const key = JSON.stringify(answers); // stable dependency across renders
  const { data: picks, loading } = useData(async () => buildRoutine(await repo.listProducts({ category: "beauty" }), answers), [key]);
  const { data: advice, loading: aiLoading } = useData(async (): Promise<Advice | null> => {
    const r = await fetch("/api/skin-match", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answers, locale }) });
    return r.status === 200 ? r.json() : null;
  }, [key, locale]);

  const skin = m[`skin_${answers.skin}`];
  const concernText = answers.concerns.map((c) => m[`concern_${c}`]).join(", ");
  const total = (picks ?? []).reduce((n, p) => n + p.product.storePriceKrw, 0);
  const fallbackReason = (p: Pick) => {
    const parts = [p.matched.skin ? fill(m.reasonFit, { skin }) : "", p.matched.concerns.length ? fill(m.reasonHelps, { concerns: p.matched.concerns.map((c) => m[`concern_${c}`]).join(", ") }) : ""].filter(Boolean);
    return parts.length ? parts.join(" · ") : m.reasonPopular;
  };
  const reasonOf = (p: Pick) => advice?.reasons.find((r) => r.productId === p.product.id)?.reason ?? fallbackReason(p);
  const summary = advice?.summary ?? fill(m.summaryFallback, { n: picks?.length ?? 0, skin, concerns: concernText });
  const tips = useMemo(() => advice?.tips.length ? advice.tips : [m.tip1, m.tip2, ...(answers.reactive ? [m.tipReactive] : [])], [advice, m, answers.reactive]);

  const share = async () => {
    if (!picks) return;
    setSharing(true);
    try {
      const blob = await makeShareImage({
        title: m.resultTitle, subtitle: `${skin} · ${concernText}`,
        steps: picks.map((p) => ({ step: m[`step_${p.step}`], brand: t(p.product.brand, locale), name: t(p.product.name, locale) })),
        footer: "hiseoul · " + m.intro3_k,
      });
      const file = new File([blob], "hiseoul-skin-routine.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: m.resultTitle });
      else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
    } catch { /* closed the share sheet */ }
    setSharing(false);
  };

  return (
    <>
      <TopBar title={m.nav_skin} />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-6">
        <section className="rounded-2xl bg-brand-soft p-5">
          <span className="text-xs font-bold text-brand">{m.skinBannerKicker}</span>
          <h1 className="mt-1 text-[22px] font-extrabold leading-snug">{m.resultTitle}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[skin, ...answers.concerns.map((c) => m[`concern_${c}`])].map((x) => <span key={x} className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand-ink">{x}</span>)}
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-[#5A2A3C]">{summary}</p>
          <p className="mt-2 text-[11px] text-[#8A5A6C]">{aiLoading ? m.aiWriting : advice ? m.aiBy : ""}</p>
        </section>

        {loading ? (
          <div className="flex flex-col gap-3">{[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-soft" />)}</div>
        ) : !picks?.length ? (
          <p className="py-8 text-center text-sm text-sub">{m.noRoutine}</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {picks.map((p) => (
              <li key={p.step}>
                <Link href={`/product/${p.product.id}`} className="flex gap-3 rounded-xl border border-line p-3">
                  <ProductThumb product={p.product} className="h-20 w-20 shrink-0 rounded-lg" />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[11px] font-bold text-brand">{m[`step_${p.step}`]}</span>
                    <span className="text-xs text-sub">{t(p.product.brand, locale)}</span>
                    <span className="truncate text-sm font-semibold">{t(p.product.name, locale)}</span>
                    <span className={`text-[13px] leading-snug text-ink ${aiLoading ? "opacity-60" : ""}`}>{reasonOf(p)}</span>
                    <Price krw={p.product.storePriceKrw} className="mt-0.5 text-sm font-bold" />
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}

        <section className="rounded-xl bg-soft p-4">
          <h2 className="text-sm font-bold">{m.tips}</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[13px] leading-relaxed text-ink">{tips.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>

        <div className="flex gap-2.5">
          <button onClick={share} disabled={sharing || !picks?.length} className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-line text-[13px] font-semibold disabled:opacity-50"><Icon name="share" size={16} />{m.shareImage}</button>
          <button onClick={onRetake} className="h-11 flex-1 rounded-xl border border-line text-[13px] font-semibold text-sub">{m.retake}</button>
        </div>
      </main>
      {!!picks?.length && (
        <BottomCTA>
          <button className={ctaClass} disabled={added} onClick={() => { picks.forEach((p) => add(p.product.id)); setAdded(true); }}>
            {added ? `✓ ${m.addedRoutine}` : fill(m.addRoutine, { amount: price(total, currency, locale) })}
          </button>
        </BottomCTA>
      )}
    </>
  );
}
