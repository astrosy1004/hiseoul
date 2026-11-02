"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deliverySlots, hotels } from "@/lib/data";
import { useStore } from "@/lib/store";
import { PriceBox, SuitcaseMeter, useTotals } from "@/components/OrderSummary";

const today = () => new Date().toISOString().slice(0, 10);

export default function CheckoutPage() {
  const { t, cart, cartItems, clear, addOrder } = useStore();
  const { weight, total, refund } = useTotals();
  const router = useRouter();
  const [hotelQuery, setHotelQuery] = useState("");
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [form, setForm] = useState({ room: "", guestName: "", passport: "", checkIn: today(), checkOut: "", deliveryDate: today(), slot: deliverySlots[1], shipHome: false });
  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const matches = useMemo(() => {
    const q = hotelQuery.toLowerCase();
    return q ? hotels.filter((h) => `${h.name} ${h.area}`.toLowerCase().includes(q)) : hotels;
  }, [hotelQuery]);
  const hotel = hotels.find((h) => h.id === hotelId);
  const hotelName = hotel?.name ?? hotelQuery.trim();
  const canSubmit = cartItems.length > 0 && hotelName && form.guestName.trim();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const id = `HS${Date.now().toString(36).toUpperCase()}`;
    addOrder({ id, createdAt: Date.now(), lines: cart, totalKrw: total, refundKrw: refund, hotel: hotelName, room: form.room || undefined, guestName: form.guestName, deliveryDate: form.deliveryDate, slot: form.slot, shipHome: form.shipHome });
    clear();
    router.push(`/orders/${id}`);
  }

  const input = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2";
  return (
    <form onSubmit={submit} className="grid gap-6 pt-6 md:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <h1 className="text-2xl font-black">🏨 {t.hotelDelivery}</h1>
        <label className="block">
          <span className="text-sm font-semibold">{t.hotel}</span>
          <input className={input} placeholder={t.hotelPlaceholder} value={hotel ? hotel.name : hotelQuery}
            onChange={(e) => { setHotelQuery(e.target.value); setHotelId(null); }} />
        </label>
        {!hotel && (
          <div className="grid gap-2 sm:grid-cols-2">
            {matches.map((h) => (
              <button type="button" key={h.id} onClick={() => setHotelId(h.id)} className="rounded-xl bg-white p-3 text-left text-sm ring-1 ring-pink-100 hover:ring-pink-400">
                <div className="font-semibold">{h.name}</div>
                <div className="text-xs text-gray-500">{h.area} · {t.sameDayCutoff} {h.sameDayCutoff}</div>
              </button>
            ))}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="text-sm font-semibold">{t.guestName}</span><input required className={input} value={form.guestName} onChange={(e) => set("guestName", e.target.value)} /></label>
          <label><span className="text-sm font-semibold">{t.room}</span><input className={input} value={form.room} onChange={(e) => set("room", e.target.value)} /></label>
          <label><span className="text-sm font-semibold">{t.checkIn}</span><input type="date" className={input} value={form.checkIn} onChange={(e) => set("checkIn", e.target.value)} /></label>
          <label><span className="text-sm font-semibold">{t.checkOut}</span><input type="date" className={input} value={form.checkOut} onChange={(e) => set("checkOut", e.target.value)} /></label>
          <label><span className="text-sm font-semibold">{t.deliveryDate}</span><input type="date" min={today()} className={input} value={form.deliveryDate} onChange={(e) => set("deliveryDate", e.target.value)} /></label>
          <label><span className="text-sm font-semibold">{t.slot}</span>
            <select className={input} value={form.slot} onChange={(e) => set("slot", e.target.value)}>
              {deliverySlots.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="sm:col-span-2"><span className="text-sm font-semibold">{t.passport}</span><input className={input} value={form.passport} onChange={(e) => set("passport", e.target.value)} /></label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.shipHome} onChange={(e) => set("shipHome", e.target.checked)} /> ✈️ {t.shipHome}
        </label>
      </div>
      <aside className="space-y-4">
        <SuitcaseMeter weight={weight} />
        <PriceBox />
        <button disabled={!canSubmit} className="w-full rounded-full bg-pink-500 py-3 font-bold text-white enabled:hover:bg-pink-600 disabled:opacity-40">{t.placeOrder}</button>
      </aside>
    </form>
  );
}
