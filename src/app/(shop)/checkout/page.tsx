"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomCTA, { ctaClass } from "@/components/shop/BottomCTA";
import TestPaySheet from "@/components/shop/TestPaySheet";
import TopBar from "@/components/shop/TopBar";
import { TotalsBox, useTotals } from "@/components/shop/Totals";
import { MIN_LEAD_HOURS, SAME_DAY_CUTOFF_HOUR } from "@/lib/config";
import { deliveryDays, SLOTS } from "@/lib/delivery";
import { price, t } from "@/lib/format";
import { fill, type Messages } from "@/lib/i18n";
import { startPayment } from "@/lib/payments";
import { OrderError, rememberLookup, repo } from "@/lib/repo";
import { useData } from "@/lib/use-data";
import { useStore } from "@/lib/store";
import type { DeliverySlot, Order, PaymentMethod } from "@/lib/types";

const METHODS: PaymentMethod[] = ["card", "alipay", "wechatpay", "paypay", "linepay", "grabpay"];
const input = "h-11 w-full rounded-xl border px-3 text-[15px] outline-none focus:border-brand";
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const DRAFT = "hs.checkout"; // remembers hotel, name, room and email for the next order

export default function Checkout() {
  const { m, locale, currency, cart, cartItems, clear, settings } = useStore();
  const router = useRouter();
  const { total } = useTotals();
  const [q, setQ] = useState("");
  const [hotelId, setHotelId] = useState<string>();
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<PaymentMethod>(locale === "ja" ? "paypay" : locale === "zh-CN" ? "alipay" : "card");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Order>();

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT) ?? "{}");
      if (d.hotelId) setHotelId(d.hotelId); if (d.name) setName(d.name); if (d.room) setRoom(d.room); if (d.email) setEmail(d.email);
    } catch { /* ignore */ }
  }, []);

  const days = useMemo(() => deliveryDays({ cutoffHour: settings?.cutoffHour ?? SAME_DAY_CUTOFF_HOUR, minLeadHours: settings?.minLeadHours ?? MIN_LEAD_HOURS }), [settings]);
  const [date, setDate] = useState<string>();
  const [slot, setSlot] = useState<DeliverySlot>();
  const day = days.find((d) => d.date === date) ?? days[0];
  const slotOk = !!slot && day.slots.some((x) => x.slot === slot && x.open);
  // Default to the earliest open evening-friendly slot.
  useEffect(() => {
    if (!slotOk) setSlot(day.slots.find((x) => x.open && x.slot === "18-21")?.slot ?? day.slots.find((x) => x.open)?.slot);
  }, [day, slotOk]);

  const { data: allHotels = [] } = useData(() => repo.listHotels(), []);
  const hotels = useMemo(() => allHotels.filter((h) => !q || Object.values(h.name).join(" ").toLowerCase().includes(q.toLowerCase())), [q, allHotels]);
  const hotel = hotelId ? allHotels.find((h) => h.id === hotelId) : undefined;
  const problems = { hotel: !hotel, name: !name.trim(), email: !EMAIL.test(email.trim()), slot: !slotOk };
  const valid = cartItems.length > 0 && cartItems.length === cart.length && !Object.values(problems).some(Boolean);

  const errText = (code: string) => (m as Record<string, string>)[`err_${code}`] ?? m.err_failed;

  const placeOrder = async () => {
    setTouched(true); setError("");
    if (!valid || !slot) return;
    setBusy(true);
    try {
      try { localStorage.setItem(DRAFT, JSON.stringify({ hotelId, name, room, email })); } catch { /* ignore */ }
      const order = await repo.createOrder({
        email: email.trim(), guestName: name.trim(), hotelId: hotel!.id, room: room.trim() || undefined,
        deliveryDate: day.date, slot, paymentMethod: method, locale, lines: cart.map((c) => ({ productId: c.productId, qty: c.qty })),
      });
      rememberLookup(order.id, order.email);
      const pay = startPayment({ ...order, method });
      if (pay.kind === "redirect") { location.href = pay.url; return; }
      setPending(order);
    } catch (e) {
      setError(errText(e instanceof OrderError ? e.message : "failed"));
    } finally { setBusy(false); }
  };

  const approve = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await repo.confirmTestPayment(pending.id, pending.email);
      clear();
      router.replace(`/orders/${pending.id}?new=1`);
    } catch (e) {
      setError(errText(e instanceof OrderError ? e.message : "failed")); setPending(undefined);
    } finally { setBusy(false); }
  };
  const cancel = () => { const id = pending?.id; setPending(undefined); clear(); router.replace(`/orders/${id}?cancelled=1`); };

  const bad = (k: keyof typeof problems) => touched && problems[k];
  return (
    <>
      <TopBar back title={m.hotelDelivery} />
      <main className="flex flex-1 flex-col gap-4 px-5 pb-6">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">{m.hotel}
          <input className={`${input} ${bad("hotel") ? "border-[#B42318]" : "border-line"}`} placeholder={m.hotelSearch} value={hotel ? t(hotel.name, locale) : q}
            onChange={(e) => { setQ(e.target.value); setHotelId(undefined); }} />
          {bad("hotel") && <Err m={m} text={m.err_invalid_hotel} />}
        </label>
        {!hotel && (
          <ul className="-mt-2 flex max-h-56 flex-col overflow-y-auto rounded-xl border border-line">
            {hotels.map((h) => (
              <li key={h.id}><button onClick={() => { setHotelId(h.id); setQ(""); }} className="w-full border-b border-[#F0F1F3] px-3 py-2.5 text-left text-sm last:border-0 hover:bg-soft">{t(h.name, locale)}</button></li>
            ))}
          </ul>
        )}
        <div className="flex gap-2.5">
          <label className="flex flex-[2] flex-col gap-1.5 text-[13px] font-semibold">{m.guestName}
            <input className={`${input} ${bad("name") ? "border-[#B42318]" : "border-line"}`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} />
            {bad("name") && <Err m={m} text={m.required} />}
          </label>
          <label className="flex flex-1 flex-col gap-1.5 text-[13px] font-semibold">{m.room}<input className={`${input} border-line`} value={room} onChange={(e) => setRoom(e.target.value)} maxLength={20} /></label>
        </div>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">{m.email}
          <input type="email" inputMode="email" className={`${input} ${bad("email") ? "border-[#B42318]" : "border-line"}`} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={200} />
          {bad("email") && <Err m={m} text={m.invalidEmail} />}
        </label>

        <fieldset>
          <legend className="mb-1.5 text-[13px] font-semibold">{m.deliveryDate}</legend>
          <div className="flex gap-2">
            {days.map((d) => (
              <button key={d.date} onClick={() => setDate(d.date)} aria-pressed={day.date === d.date}
                className={`flex h-14 flex-1 flex-col items-center justify-center rounded-xl text-sm font-semibold ${day.date === d.date ? "border-2 border-brand bg-brand-soft" : "border border-line"}`}>
                {m[`day${d.offset}`]}<span className="text-[11px] font-normal text-sub">{d.date.slice(5).replace("-", "/")}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-semibold">{m.deliveryTime}</legend>
          <div className="grid grid-cols-2 gap-2">
            {SLOTS.map((s) => {
              const open = day.slots.find((x) => x.slot === s)?.open;
              return (
                <button key={s} disabled={!open} onClick={() => setSlot(s)} aria-pressed={slot === s}
                  className={`h-11 rounded-xl text-sm font-semibold disabled:bg-soft disabled:text-mute ${slot === s && open ? "border-2 border-brand bg-brand-soft" : "border border-line"}`}>
                  {s.replace("-", ":00 – ")}:00{!open && ` · ${m.slotClosed}`}
                </button>
              );
            })}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-semibold">{m.payWith}</legend>
          <div className="flex flex-wrap gap-1.5">
            {METHODS.map((x) => (
              <button key={x} onClick={() => setMethod(x)} aria-pressed={method === x} className={`rounded-lg px-2.5 py-2 text-xs font-semibold ${method === x ? "border-2 border-brand" : "border border-line"}`}>{m[`pm_${x}`]}</button>
            ))}
          </div>
        </fieldset>
        <TotalsBox />
        <p className="text-xs leading-relaxed text-sub">{m.storeBuyNote}</p>
        <p className="text-xs leading-relaxed text-sub">{m.privacyNote} <Link href="/privacy" className="font-semibold underline">{m.privacy}</Link></p>
        {error && <p role="alert" className="rounded-xl bg-[#FDECEC] px-4 py-3 text-sm text-[#B42318]">{error}</p>}
      </main>
      <BottomCTA>
        <button disabled={busy || cartItems.length === 0} onClick={placeOrder} className={ctaClass}>
          {busy && !pending ? m.placing : fill(m.pay, { amount: price(total, currency, locale) })}
        </button>
      </BottomCTA>
      {pending && <TestPaySheet amountKrw={pending.totalKrw} method={method} busy={busy} onApprove={approve} onCancel={cancel} />}
    </>
  );
}

function Err({ text }: { m: Messages; text: string }) {
  return <span className="text-xs font-normal text-[#B42318]">{text}</span>;
}
