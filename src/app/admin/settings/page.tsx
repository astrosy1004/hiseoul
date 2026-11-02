"use client";
// Owner only: fees and delivery times without a code release.
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import type { Settings } from "@/lib/delivery";
import { krw } from "@/lib/format";
import { repo } from "@/lib/repo";
import { useData } from "@/lib/use-data";

const input = "h-10 w-32 rounded-lg border border-line px-2.5 text-right text-sm outline-none focus:border-brand";
const num = (v: string, max: number) => Math.min(max, Number(v.replace(/\D/g, "") || 0));

export default function AdminSettings() {
  const { data, error } = useData(() => repo.getSettings(), []);
  const [s, setS] = useState<Settings>();
  const [status, setStatus] = useState<{ ok: boolean; text: string }>();
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setS(data); }, [data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!s) return;
    if (!s.testPayments && data?.testPayments && !window.confirm("시험 결제를 끄면 실제 결제사(PG)가 연결되기 전까지 손님이 결제할 수 없어요. 끌까요?")) return;
    setSaving(true); setStatus(undefined);
    try { await repo.saveSettings(s); setStatus({ ok: true, text: "저장했어요. 새로 들어오는 주문부터 적용돼요." }); }
    catch (err) { setStatus({ ok: false, text: `저장하지 못했어요: ${err instanceof Error ? err.message : err}` }); }
    finally { setSaving(false); }
  };

  const row = (label: string, hint: string, control: React.ReactNode) => (
    <label className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] py-3.5 last:border-0">
      <span><span className="block text-sm font-semibold">{label}</span><span className="text-xs text-sub">{hint}</span></span>
      {control}
    </label>
  );

  return (
    <AdminShell>
      <form onSubmit={save} className="flex max-w-[620px] flex-col gap-5">
        <div>
          <h1 className="text-2xl font-extrabold">운영 설정</h1>
          <p className="mt-1 text-[13px] text-sub">대표만 바꿀 수 있어요 · 이미 받은 주문의 금액은 바뀌지 않아요</p>
        </div>
        {error && <p className="rounded-xl bg-[#FDECEC] px-4 py-3 text-sm text-[#B42318]">불러오지 못했어요: {error}</p>}
        {s && (
          <div className="rounded-2xl border border-line bg-white px-5">
            {row("구매 대행 수수료", `주문 1건당 · 지금 ${krw(s.serviceFeeKrw)}`, <span className="flex items-center gap-1.5 text-sm"><input className={input} inputMode="numeric" value={s.serviceFeeKrw} onChange={(e) => setS({ ...s, serviceFeeKrw: num(e.target.value, 100000) })} />원</span>)}
            {row("호텔 배달비", "0원이면 손님 화면에 ‘무료’로 보여요", <span className="flex items-center gap-1.5 text-sm"><input className={input} inputMode="numeric" value={s.deliveryFeeKrw} onChange={(e) => setS({ ...s, deliveryFeeKrw: num(e.target.value, 100000) })} />원</span>)}
            {row("당일 배달 주문 마감", "이 시각 전에 주문하면 오늘 받을 수 있어요 (서울 시간)", <span className="flex items-center gap-1.5 text-sm"><input className={input} inputMode="numeric" value={s.cutoffHour} onChange={(e) => setS({ ...s, cutoffHour: num(e.target.value, 23) })} />시</span>)}
            {row("준비 시간", "주문 후 이 시간이 지난 배달 시간대부터 고를 수 있어요", <span className="flex items-center gap-1.5 text-sm"><input className={input} inputMode="numeric" value={s.minLeadHours} onChange={(e) => setS({ ...s, minLeadHours: num(e.target.value, 12) })} />시간</span>)}
            {row("시험 결제", s.testPayments ? "켜짐 · 실제로 돈이 나가지 않아요. 결제사 연결 전까지 켜 두세요" : "꺼짐 · 실제 결제사가 연결돼 있어야 해요",
              <button type="button" role="switch" aria-checked={s.testPayments} aria-label="시험 결제" onClick={() => setS({ ...s, testPayments: !s.testPayments })} className={`relative h-[26px] w-11 shrink-0 rounded-full transition ${s.testPayments ? "bg-brand" : "bg-[#C9CDD2]"}`}>
                <span className={`absolute top-[3px] h-5 w-5 rounded-full bg-white transition-all ${s.testPayments ? "left-[21px]" : "left-[3px]"}`} />
              </button>)}
          </div>
        )}
        <div className="flex items-center gap-3">
          <button disabled={!s || saving} className="h-11 rounded-xl bg-brand px-6 text-sm font-bold text-white disabled:opacity-40">{saving ? "저장 중…" : "저장"}</button>
          {status && <span role="status" className={`text-[13px] font-semibold ${status.ok ? "text-[#1F7A3A]" : "text-[#B42318]"}`}>{status.text}</span>}
        </div>
      </form>
    </AdminShell>
  );
}
