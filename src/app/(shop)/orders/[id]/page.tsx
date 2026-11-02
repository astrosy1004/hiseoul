"use client";
import Link from "next/link";
import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  // Orders are private: show one only after a lookup with its email in this tab.
  const { data, loading } = useData(async () => {
    const email = recallLookup(id);
    if (!email) return null;
    const order = await repo.lookupOrder(id, email);
    return order ? { order, hotel: await repo.getHotel(order.hotelId) } : null;
  }, [id]);
  useEffect(() => { if (!loading && !data) router.replace("/orders/lookup"); }, [loading, data, router]);
  if (!data) return (<><TopBar back /><p className="p-10 text-center text-sub">…</p></>);
  const { order, hotel } = data;
  const done = ORDER_FLOW.indexOf(order.status);
  return (
    <>
      <TopBar back title={fill(m.order, { id: order.id })} />
      <main className="flex flex-1 flex-col gap-6 px-5 pb-8">
        <div className="flex flex-col gap-1 rounded-2xl bg-brand-soft p-[18px]">
          <span className="text-[13px] font-semibold text-brand-ink">{m.arriving} · {order.deliveryDate}</span>
          <span className="text-2xl font-extrabold">{order.slot.replace("-", ":00 – ")}:00</span>
          <span className="text-[13px] text-[#6B3A4C]">{fill(m.frontDesk, { hotel: hotel ? t(hotel.name, locale) : "", name: order.guestName })}</span>
        </div>
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
        {order.handoverPhotoUrl ? <img src={order.handoverPhotoUrl} alt="" className="rounded-xl" /> : (
          <div className="flex h-28 items-center justify-center rounded-xl bg-placeholder text-xs text-mute">{m.handoverPhoto}</div>
        )}
        <Link href="/" className="flex h-[52px] items-center justify-center rounded-xl bg-brand font-bold text-white">{m.keepShopping}</Link>
      </main>
    </>
  );
}
