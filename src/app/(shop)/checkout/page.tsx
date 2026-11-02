"use client";
import { useMemo, useState } from "react";
import BottomCTA, { ctaClass } from "@/components/shop/BottomCTA";
import TopBar from "@/components/shop/TopBar";
import { TotalsBox, useTotals } from "@/components/shop/Totals";
import { price, t } from "@/lib/format";
import { fill } from "@/lib/i18n";
import { repo } from "@/lib/repo";
import { useData } from "@/lib/use-data";
import { useStore } from "@/lib/store";
import type { DeliverySlot, PaymentMethod } from "@/lib/types";

const SLOTS: DeliverySlot[] = ["12-15", "15-18", "18-21", "21-23"];
const METHODS: PaymentMethod[] = ["card", "alipay", "wechatpay", "paypay", "linepay", "grabpay"];
const input = "h-11 w-full rounded-xl border border-line px-3 text-[15px] outline-none focus:border-brand";

export default function Checkout() {
  const { m, locale, currency, cartItems } = useStore();
  const { total } = useTotals();
  const [q, setQ] = useState("");
  const [hotelId, setHotelId] = useState<string>();
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [email, setEmail] = useState("");
  const [slot, setSlot] = useState<DeliverySlot>("18-21");
  const [method, setMethod] = useState<PaymentMethod>("card");
  const { data: allHotels = [] } = useData(() => repo.listHotels(), []);
  const hotels = useMemo(() => allHotels.filter((h) => !q || `${h.name.en} ${h.name.ko ?? ""}`.toLowerCase().includes(q.toLowerCase())), [q, allHotels]);
  const hotel = hotelId ? allHotels.find((h) => h.id === hotelId) : undefined;
  const valid = cartItems.length > 0 && hotel && name.trim() && /\S+@\S+\.\S+/.test(email);

  return (
    <>
      <TopBar back title={m.hotelDelivery} />
      <main className="flex flex-1 flex-col gap-4 px-5 pb-6">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">{m.hotel}
          <input className={input} placeholder={m.hotelSearch} value={hotel ? t(hotel.name, locale) : q} onChange={(e) => { setQ(e.target.value); setHotelId(undefined); }} />
        </label>
        {!hotel && (
          <ul className="-mt-2 flex flex-col overflow-hidden rounded-xl border border-line">
            {hotels.map((h) => (
              <li key={h.id}><button onClick={() => setHotelId(h.id)} className="w-full border-b border-[#F0F1F3] px-3 py-2.5 text-left text-sm last:border-0 hover:bg-soft">{t(h.name, locale)}</button></li>
            ))}
          </ul>
        )}
        <div className="flex gap-2.5">
          <label className="flex flex-[2] flex-col gap-1.5 text-[13px] font-semibold">{m.guestName}<input className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
          <label className="flex flex-1 flex-col gap-1.5 text-[13px] font-semibold">{m.room}<input className={input} value={room} onChange={(e) => setRoom(e.target.value)} /></label>
        </div>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">{m.email}<input type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-[13px] font-semibold">{m.deliveryTime}</legend>
          <div className="grid grid-cols-2 gap-2">
            {SLOTS.map((s) => (
              <button key={s} onClick={() => setSlot(s)} className={`h-11 rounded-xl text-sm font-semibold ${slot === s ? "border-2 border-brand bg-brand-soft" : "border border-line"}`}>{s.replace("-", ":00 – ")}:00</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-semibold">{m.payWith}</legend>
          <div className="flex flex-wrap gap-1.5">
            {METHODS.map((x) => (
              <button key={x} onClick={() => setMethod(x)} className={`rounded-lg px-2.5 py-2 text-xs font-semibold ${method === x ? "border-2 border-brand" : "border border-line"}`}>{m[`pm_${x}`]}</button>
            ))}
          </div>
        </fieldset>
        <TotalsBox />
        <p className="text-center text-xs text-mute">{fill(m.comingSoon, { n: 5 })}: Payment</p>
      </main>
      <BottomCTA>
        <button disabled={!valid} className={ctaClass}>{fill(m.pay, { amount: price(total, currency, locale) })}</button>
      </BottomCTA>
    </>
  );
}
