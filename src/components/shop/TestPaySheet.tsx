"use client";
import { useStore } from "@/lib/store";
import { price } from "@/lib/format";

/** Stand-in for a payment provider's page while payments are in test mode. */
export default function TestPaySheet({ amountKrw, method, busy, onApprove, onCancel }: {
  amountKrw: number; method: string; busy: boolean; onApprove: () => void; onCancel: () => void;
}) {
  const { m, currency, locale } = useStore();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="testpay-title">
      <div className="w-full max-w-[480px] rounded-t-3xl bg-white px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-6">
        <div className="flex items-center gap-2">
          <span className="rounded bg-[#FFF4E5] px-1.5 py-0.5 text-[11px] font-bold text-[#8A4B08]">TEST</span>
          <h2 id="testpay-title" className="text-lg font-bold">{m.testPayTitle}</h2>
        </div>
        <p className="mt-2 text-sm text-sub">{m.testPayBody}</p>
        <div className="mt-4 flex items-baseline justify-between rounded-xl bg-soft px-4 py-3">
          <span className="text-sm text-sub">{m[`pm_${method}` as keyof typeof m]}</span>
          <span className="text-xl font-extrabold">{price(amountKrw, currency, locale)}</span>
        </div>
        <div className="mt-5 flex gap-2.5">
          <button onClick={onCancel} disabled={busy} className="h-[52px] flex-1 rounded-xl border border-line font-semibold text-sub">{m.cancelPay}</button>
          <button onClick={onApprove} disabled={busy} className="h-[52px] flex-[2] rounded-xl bg-brand font-bold text-white disabled:opacity-50">{busy ? "…" : m.approvePay}</button>
        </div>
      </div>
    </div>
  );
}
