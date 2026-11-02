"use client";
import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { ROLE_LABEL } from "@/lib/admin-session";
import { repo } from "@/lib/repo";
import type { Staff } from "@/lib/types";

const PERMS: [string, boolean, boolean, boolean][] = [
  ["주문 보기·상태 변경", true, true, true],
  ["상품 등록·TOP 10 반영", true, true, false],
  ["고객 정보·환불", true, true, false],
  ["정산·매출", true, false, false],
  ["직원 계정 관리", true, false, false],
];

export default function Accounts() {
  const [people, setPeople] = useState<Staff[]>(repo.listStaff());
  const fmt = (iso?: string) => iso ? new Date(iso).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "초대 수락 전";
  return (
    <AdminShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">직원 계정</h1>
            <p className="mt-1 text-[13px] text-sub">대표만 볼 수 있어요 · 초대 메일로 가입하고 2단계 인증을 켜야 로그인돼요</p>
          </div>
          <button className="h-11 rounded-xl bg-brand px-4 text-sm font-bold text-white">직원 초대</button>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-xs text-sub"><tr className="border-b border-line">{["이름 · 이메일", "권한", "2단계 인증", "마지막 로그인", "상태", ""].map((h, i) => <th key={i} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id} className="border-b border-[#F0F1F3] last:border-0">
                  <td className="px-4 py-3"><div className="font-semibold">{p.name}</div><div className="text-xs text-sub">{p.email}</div></td>
                  <td className="px-4 py-3"><span className="rounded-full bg-soft px-2.5 py-1 text-xs font-bold">{ROLE_LABEL[p.role]}</span></td>
                  <td className={`px-4 py-3 text-[13px] font-bold ${p.mfaEnabled ? "text-[#1F7A3A]" : "text-[#B4410E]"}`}>{p.mfaEnabled ? "켜짐" : "미설정"}</td>
                  <td className="px-4 py-3 text-[13px] text-sub">{fmt(p.lastLoginAt)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.active ? "bg-[#E9F6EC] text-[#1F7A3A]" : "bg-placeholder text-sub"}`}>{p.active ? "활성" : "정지"}</span></td>
                  <td className="px-4 py-3">{p.role !== "owner" && <button onClick={() => setPeople((ps) => ps.map((x) => x.id === p.id ? { ...x, active: !x.active } : x))} className="h-8 rounded-lg border border-line px-2.5 text-xs font-semibold">{p.active ? "정지" : "다시 켜기"}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-line bg-white p-5">
          <h2 className="mb-2 font-bold">권한별로 할 수 있는 일</h2>
          <table className="w-full min-w-[520px] text-[13px]">
            <thead className="text-left text-sub"><tr><th className="py-2">기능</th><th>대표</th><th>운영 매니저</th><th>구매·배달 직원</th></tr></thead>
            <tbody>{PERMS.map(([f, ...r]) => <tr key={f} className="border-t border-[#F0F1F3]"><td className="py-2">{f}</td>{r.map((ok, i) => <td key={i} className={ok ? "" : "text-mute"}>{ok ? "가능" : "불가"}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
