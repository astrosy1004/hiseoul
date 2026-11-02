"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/data";
import { useStore } from "@/lib/store";

// Demo: status advances every 8 seconds. A real version would read courier status from the backend.
export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, orders, currency } = useStore();
  const order = orders.find((o) => o.id === id);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  if (!order) return <p className="pt-16 text-center text-gray-500">…</p>;
  const steps = [t.st_confirmed, t.st_picked, t.st_onway, t.st_delivered];
  const stage = Math.min(steps.length - 1, Math.floor((now - order.createdAt) / 8000));
  return (
    <div className="mx-auto max-w-xl space-y-6 pt-10">
      <div className="text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="mt-2 text-2xl font-black">{t.orderPlaced}</h1>
        <p className="text-sm text-gray-500">#{order.id}</p>
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-pink-100">
        <h2 className="mb-4 font-bold">🚚 {t.tracking}</h2>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s} className={`flex items-center gap-3 ${i <= stage ? "text-gray-900" : "text-gray-300"}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs text-white ${i <= stage ? "bg-pink-500" : "bg-gray-200"}`}>{i < stage ? "✓" : i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>
      <div className="space-y-1 rounded-2xl bg-white p-5 text-sm ring-1 ring-pink-100">
        <div>🏨 {order.hotel}{order.room ? ` · ${order.room}` : ""}</div>
        <div>👤 {order.guestName}</div>
        <div>📅 {order.deliveryDate} · {order.slot}</div>
        {order.shipHome && <div>✈️ {t.shipHome}</div>}
        <div className="pt-2 font-bold">{t.total}: {formatPrice(order.totalKrw, currency)} <span className="font-normal text-emerald-600">({t.taxRefund} {formatPrice(order.refundKrw, currency)})</span></div>
      </div>
      <Link href="/" className="block text-center text-pink-600 underline">{t.backHome}</Link>
    </div>
  );
}
