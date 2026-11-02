"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Price from "@/components/shop/Price";
import TestPaySheet from "@/components/shop/TestPaySheet";
import TopBar from "@/components/shop/TopBar";
import { t } from "@/lib/format";
import { fill } from "@/lib/i18n";
import { recallLookup, repo } from "@/lib/repo";
import { useData } from "@/lib/use-data";
import { useStore } from "@/lib/store";
import { ORDER_FLOW } from "@/lib/types";

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { m, locale } = useStore();
  const router = useRouter();
  const search = useSearchParams();
  const [paying, setPaying] = useState(false);
  const [busy, setBusy] = useState(false);
  // Orders are private: show one only after a lookup (or checkout) with its email in this tab.
  const { data, loading, reload } = useData(async () => {
    const email = recallLookup(id);
    if (!email) return null;
    const order = await repo.lookupOrder(id, email);
    if (!order) return null;
    const [hotel, products] = await Promise.all([repo.getHotel(order.hotelId), Promise.all(order.lines.map((l) => repo.getProduct(l.productId)))]);
    return { order, hotel, products };
  }, [id]);
  useEffect(() => { if (!loading && !data) router.replace("/orders/lookup"); }, [loading, data, router]);
  if (!data) return (<><TopBar back /><p className="p-10 text-center text-sub">…</p></>);
  const { order, hotel, products } = data;
  const done = ORDER_FLOW.indexOf(order.status);
  const isNew = search.get("new") === "1" && order.status === "paid";
  const off = order.status === "pending" || order.status === "cancelled";

  const pay = async () => {
    setBusy(true);
    try { await repo.confirmTestPayment(order.id, order.email); setPaying(false); router.replace(`/orders/${order.id}?new=1`); reload(); }
    catch { setPaying(false); reload(); }
    finally { setBusy(false); }
  };

  return (
    <>
      <TopBar back title={fill(m.order, { id: order.id })} />
      <main className="flex flex-1 flex-col gap-6 px-5 pb-8">
        {isNew && (
          <div className="flex flex-col gap-1 rounded-2xl border-2 border-brand p-[18px]">
            <span className="text-lg font-extrabold text-brand">✓ {m.orderPlaced}</span>
            <span className="text-[13px] text-sub">{fill(m.orderThanks, { email: order.email })}</span>
          </div>
        )}
        {off ? (
          <div className="flex flex-col gap-2 rounded-2xl bg-soft p-[18px]">
            <span className="text-lg font-extrabold">{m[`st_${order.status}`]}</span>
            <span className="text-[13px] text-sub">{search.get("cancelled") ? m.payCancelled : m[`st_${order.status}_d`]}</span>
            {order.status === "pending" && <button onClick={() => setPaying(true)} className="mt-1 h-11 rounded-xl bg-brand font-bold text-white">{m.payNow}</button>}
          </div>
        ) : (
          <div className="flex flex-col gap-1 rounded-2xl bg-brand-soft p-[18px]">
            <span className="text-[13px] font-semibold text-brand-ink">{m.arriving} · {order.deliveryDate}</span>
            <span className="text-2xl font-extrabold">{order.slot.replace("-", ":00 – ")}:00</span>
            <span className="text-[13px] text-[#6B3A4C]">{fill(m.frontDesk, { hotel: hotel ? t(hotel.name, locale) : "", name: order.guestName })}</span>
          </div>
        )}
        {!off && (
          <ol>
            {ORDER_FLOW.map((s, i) => (
              <li key={s} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span className={`h-3.5 w-3.5 rounded-full ${i < done ? "bg-brand" : i === done ? "border-[3px] border-brand bg-white" : "border-2 border-[#C9CDD2]"}`} />
                  {i < ORDER_FLOW.length - 1 && <span className={`w-0.5 flex-1 ${i < done ? "bg-brand" : "bg-line"}`} />}
                </div>
                <div className="flex flex-col pb-5">
                  <span className={`text-[15px] font-bold ${i <= done ? "" : "text-mute"}`}>{m[`st_${s}`]}</span>
                  <span className="text-[13px] text-sub">{m[`st_${s}_d`]}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
        {!off && (order.handoverPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={order.handoverPhotoUrl} alt="" className="rounded-xl" />
        ) : (
          <div className="flex h-28 items-center justify-center rounded-xl bg-placeholder text-xs text-mute">{m.handoverPhoto}</div>
        ))}
        <section>
          <h2 className="text-sm font-bold">{m.orderItems}</h2>
          <ul className="mt-2">
            {order.lines.map((l, i) => (
              <li key={l.productId} className="flex justify-between gap-3 border-b border-[#F0F1F3] py-2 text-sm">
                <span className="min-w-0 truncate">{products[i] ? t(products[i]!.name, locale) : l.productId} × {l.qty}</span>
                <Price krw={l.unitPriceKrw * l.qty} className="shrink-0 font-semibold" />
              </li>
            ))}
            <li className="flex justify-between py-2 text-sm text-sub"><span>{m.serviceFee}</span><Price krw={order.serviceFeeKrw} /></li>
            {order.deliveryFeeKrw > 0 && <li className="flex justify-between py-2 text-sm text-sub"><span>{m.deliveryFee}</span><Price krw={order.deliveryFeeKrw} /></li>}
            <li className="flex justify-between pt-2 text-base font-extrabold"><span>{m.total}</span><Price krw={order.totalKrw} /></li>
          </ul>
        </section>
        <Link href="/" className="flex h-[52px] items-center justify-center rounded-xl bg-brand font-bold text-white">{m.keepShopping}</Link>
      </main>
      {paying && <TestPaySheet amountKrw={order.totalKrw} method={order.paymentMethod} busy={busy} onApprove={pay} onCancel={() => setPaying(false)} />}
    </>
  );
}
