"use client";
import Price from "./Price";
import { DELIVERY_FEE_KRW, SERVICE_FEE_KRW } from "@/lib/config";
import { useStore } from "@/lib/store";

export function useTotals() {
  const { cartItems } = useStore();
  const items = cartItems.reduce((s, x) => s + x.product.storePriceKrw * x.qty, 0);
  const service = items > 0 ? SERVICE_FEE_KRW : 0;
  const delivery = items > 0 ? DELIVERY_FEE_KRW : 0;
  return { items, service, delivery, total: items + service + delivery };
}

export function TotalsBox() {
  const { m } = useStore();
  const x = useTotals();
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-soft p-3.5 text-sm">
      <div className="flex justify-between"><span className="text-sub">{m.itemsTotal}</span><Price krw={x.items} /></div>
      <div className="flex justify-between"><span className="text-sub">{m.serviceFee}</span><Price krw={x.service} /></div>
      <div className="flex justify-between"><span className="text-sub">{m.deliveryFee}</span>{x.delivery === 0 ? <span>{m.free}</span> : <Price krw={x.delivery} />}</div>
      <hr className="border-line" />
      <div className="flex justify-between text-base font-extrabold"><span>{m.total}</span><Price krw={x.total} /></div>
    </div>
  );
}

