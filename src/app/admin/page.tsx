"use client";
import { Fragment, useRef, useState } from "react";
import { shrinkImage } from "@/lib/admin-api";
import { seoulNow } from "@/lib/delivery";
import AdminShell from "@/components/admin/AdminShell";
import { t } from "@/lib/format";
import { repo } from "@/lib/repo";
import { useData } from "@/lib/use-data";
import { ORDER_FLOW, type Order, type OrderStatus } from "@/lib/types";

const LABEL: Record<OrderStatus, string> = { pending: "결제 대기", paid: "결제 완료", purchased: "구매 완료", delivering: "배달 중", delivered: "프런트 전달", cancelled: "취소" };
const NEXT: Record<OrderStatus, string> = { pending: "", paid: "구매 완료 처리", purchased: "배달 출발", delivering: "전달 완료", delivered: "", cancelled: "" };
const BADGE: Record<OrderStatus, string> = { pending: "bg-soft text-sub", paid: "bg-[#FFF4E5] text-[#8A4B08]", purchased: "bg-[#EAF1FF] text-[#1D4ED8]", delivering: "bg-brand-soft text-brand-ink", delivered: "bg-[#E9F6EC] text-[#1F7A3A]", cancelled: "bg-soft text-mute" };
const AREA: Record<string, string> = { myeongdong: "명동", hongdae: "홍대", gangnam: "강남", itaewon: "이태원", jamsil: "잠실", gwanghwamun: "광화문" };

export default function AdminOrders() {
  const { data, error, reload } = useData(() => Promise.all([repo.listOrders(), repo.listHotels(), repo.getSettings()]), []);
  const [busy, setBusy] = useState<string>();
  const [saveError, setSaveError] = useState("");
  const [handover, setHandover] = useState<string>(); // order waiting for its front-desk photo
  const [day, setDay] = useState<"today" | "tomorrow" | "all">("today");
  const camera = useRef<HTMLInputElement>(null);
  const today = seoulNow().date;
  const tomorrow = new Date(Date.parse(today) + 86_400_000).toISOString().slice(0, 10);
  // Unpaid and cancelled orders are not work for the team.
  const orders: Order[] = (data?.[0] ?? [])
    .filter((o) => ORDER_FLOW.includes(o.status) && (day === "all" || o.deliveryDate === (day === "today" ? today : tomorrow)))
    .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate) || a.slot.localeCompare(b.slot));
  const hotelOf = (id: string) => data?.[1].find((h) => h.id === id);
  const run = async (id: string, work: () => Promise<void>) => {
    setBusy(id); setSaveError("");
    try { await work(); setHandover(undefined); reload(); }
    catch (e) { setSaveError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(undefined); }
  };
  const advance = (o: Order) => {
    if (o.status === "delivering") return setHandover(handover === o.id ? undefined : o.id);
    run(o.id, () => repo.setOrderStatus(o.id, ORDER_FLOW[ORDER_FLOW.indexOf(o.status) + 1]));
  };
  const withPhoto = (file?: File) => {
    const id = handover;
    if (!file || !id) return;
    run(id, async () => repo.setOrderStatus(id, "delivered", await repo.uploadHandoverPhoto(id, await shrinkImage(file, 1600))));
  };
  const count = (s: OrderStatus) => orders.filter((o) => o.status === s).length;
  return (
    <AdminShell>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-extrabold">오늘 주문</h1>
          <p className="mt-1 text-[13px] text-sub">당일 배달 마감 {data?.[2].cutoffHour ?? 15}:00 · 같은 지역·시간대 주문은 묶어서 구매하고 보내요 · 상태를 바꾸면 손님에게 알림 메일이 가요</p>
        </div>
        <div className="flex gap-1.5">
          {([["today", `오늘 ${today.slice(5).replace("-", "/")}`], ["tomorrow", "내일"], ["all", "전체"]] as const).map(([k, label]) => (
            <button key={k} aria-pressed={day === k} onClick={() => setDay(k)} className={`h-9 rounded-full px-4 text-sm font-semibold ${day === k ? "bg-ink text-white" : "border border-line bg-white"}`}>{label}</button>
          ))}
        </div>
        <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { withPhoto(e.target.files?.[0]); e.target.value = ""; }} />
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
                  <Fragment key={o.id}>
                  <tr className="border-b border-[#F0F1F3] last:border-0">
                    <td className="px-4 py-3 font-semibold">{o.id}</td>
                    <td className="px-4 py-3"><div className="font-semibold">{h ? t(h.name, "ko") : "-"}</div><div className="text-xs text-sub">{h ? AREA[h.area] : ""}{o.room ? ` · ${o.room}호` : ""}</div></td>
                    <td className="px-4 py-3">{o.guestName}</td>
                    <td className="px-4 py-3"><div>{o.slot.replace("-", "–")}시</div><div className="text-xs text-sub">{o.deliveryDate.slice(5).replace("-", "/")}</div></td>
                    <td className="px-4 py-3">{o.lines.reduce((n, l) => n + l.qty, 0)}개</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${BADGE[o.status]}`}>{LABEL[o.status]}</span></td>
                    <td className="px-4 py-3">
                      {NEXT[o.status] && <button disabled={busy === o.id} onClick={() => advance(o)} className="disabled:opacity-50 h-9 rounded-lg border border-brand px-3 text-[13px] font-semibold text-brand hover:bg-brand-soft">{busy === o.id ? "저장 중…" : NEXT[o.status]}</button>}
                      {o.status === "delivered" && o.handoverPhotoUrl && <a href={o.handoverPhotoUrl} target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-sub underline">전달 사진</a>}
                    </td>
                  </tr>
                  {handover === o.id && (
                    <tr className="border-b border-[#F0F1F3] bg-brand-soft/50">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2 text-[13px]">
                          <span className="mr-2 font-semibold">프런트에 맡긴 쇼핑백 사진을 찍어 주세요. 손님에게 사진과 함께 도착 메일이 가요.</span>
                          <button disabled={busy === o.id} onClick={() => camera.current?.click()} className="h-9 rounded-lg bg-brand px-3 font-bold text-white disabled:opacity-50">사진 찍고 완료</button>
                          <button disabled={busy === o.id} onClick={() => run(o.id, () => repo.setOrderStatus(o.id, "delivered"))} className="h-9 rounded-lg border border-line bg-white px-3 font-semibold">사진 없이 완료</button>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}
              {data && orders.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sub">{day === "all" ? "아직 주문이 없어요." : "이 날 배달할 주문이 없어요."}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
