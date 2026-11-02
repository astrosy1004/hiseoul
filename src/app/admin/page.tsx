"use client";
import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { t } from "@/lib/format";
import { repo } from "@/lib/repo";
import { useData } from "@/lib/use-data";
import { ORDER_FLOW, type Order, type OrderStatus } from "@/lib/types";

const LABEL: Record<OrderStatus, string> = { paid: "결제 완료", purchased: "구매 완료", delivering: "배달 중", delivered: "프런트 전달" };
const NEXT: Record<OrderStatus, string> = { paid: "구매 완료 처리", purchased: "배달 출발", delivering: "전달 완료", delivered: "" };
const BADGE: Record<OrderStatus, string> = { paid: "bg-[#FFF4E5] text-[#8A4B08]", purchased: "bg-[#EAF1FF] text-[#1D4ED8]", delivering: "bg-brand-soft text-brand-ink", delivered: "bg-[#E9F6EC] text-[#1F7A3A]" };
const AREA: Record<string, string> = { myeongdong: "명동", hongdae: "홍대", gangnam: "강남", itaewon: "이태원", jamsil: "잠실", gwanghwamun: "광화문" };

export default function AdminOrders() {
  const { data, error, reload } = useData(() => Promise.all([repo.listOrders(), repo.listHotels()]), []);
  const [busy, setBusy] = useState<string>();
  const [saveError, setSaveError] = useState("");
  const orders: Order[] = data?.[0] ?? [];
  const hotelOf = (id: string) => data?.[1].find((h) => h.id === id);
  const advance = async (o: Order) => {
    setBusy(o.id); setSaveError("");
    try { await repo.setOrderStatus(o.id, ORDER_FLOW[Math.min(3, ORDER_FLOW.indexOf(o.status) + 1)]); reload(); }
    catch (e) { setSaveError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(undefined); }
  };
  const count = (s: OrderStatus) => orders.filter((o) => o.status === s).length;
  return (
    <AdminShell>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-extrabold">오늘 주문</h1>
          <p className="mt-1 text-[13px] text-sub">당일 배달 마감 15:00 · 같은 지역·시간대 주문은 묶어서 구매하고 보내요</p>
        </div>
        {(error || saveError) && <p className="rounded-xl bg-[#FDECEC] px-4 py-3 text-sm text-[#B42318]">불러오거나 저장하지 못했어요: {error || saveError}</p>}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {ORDER_FLOW.map((s) => (
            <div key={s} className="rounded-xl border border-line bg-white p-4"><div className="text-[13px] text-sub">{LABEL[s]}</div><div className="text-[26px] font-extrabold">{count(s)}</div></div>
          ))}
        </div>
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="text-left text-xs text-sub"><tr className="border-b border-line">{["주문번호", "호텔 · 지역", "예약자", "배달 시간", "상품", "상태", "다음 처리"].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead>
            <tbody>
              {orders.map((o) => {
                const h = hotelOf(o.hotelId);
                return (
                  <tr key={o.id} className="border-b border-[#F0F1F3] last:border-0">
                    <td className="px-4 py-3 font-semibold">{o.id}</td>
                    <td className="px-4 py-3"><div className="font-semibold">{h ? t(h.name, "ko") : "-"}</div><div className="text-xs text-sub">{h ? AREA[h.area] : ""}</div></td>
                    <td className="px-4 py-3">{o.guestName}</td>
                    <td className="px-4 py-3">{o.slot.replace("-", "–")}시</td>
                    <td className="px-4 py-3">{o.lines.reduce((n, l) => n + l.qty, 0)}개</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${BADGE[o.status]}`}>{LABEL[o.status]}</span></td>
                    <td className="px-4 py-3">{NEXT[o.status] && <button disabled={busy === o.id} onClick={() => advance(o)} className="disabled:opacity-50 h-9 rounded-lg border border-brand px-3 text-[13px] font-semibold text-brand hover:bg-brand-soft">{NEXT[o.status]}</button>}</td>
                  </tr>
                );
              })}
              {data && orders.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sub">아직 주문이 없어요.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
