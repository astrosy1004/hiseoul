"use client";
import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { inviteStaff } from "@/lib/admin-api";
import { ROLE_LABEL } from "@/lib/admin-session";
import { repo } from "@/lib/repo";
import { useData } from "@/lib/use-data";

const PERMS: [string, boolean, boolean, boolean][] = [
  ["주문 보기·상태 변경", true, true, true],
  ["상품 등록·TOP 10 반영", true, true, false],
  ["고객 정보·환불", true, true, false],
  ["정산·매출", true, false, false],
  ["직원 계정 관리", true, false, false],
];

export default function Accounts() {
  const { data: people = [], error, reload } = useData(() => repo.listStaff(), []);
  const toggle = async (id: string, active: boolean) => { try { await repo.setStaffActive(id, active); } finally { reload(); } };
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState("");
  const fmt = (iso?: string) => iso ? new Date(iso).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "초대 수락 전";
  return (
    <AdminShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">직원 계정</h1>
            <p className="mt-1 text-[13px] text-sub">대표만 볼 수 있어요 · 초대 메일로 가입하고 2단계 인증을 켜야 로그인돼요</p>
          </div>
          <button onClick={() => { setOpen(true); setDone(""); }} className="h-11 rounded-xl bg-brand px-4 text-sm font-bold text-white">직원 초대</button>
        </div>
        {open && <InviteForm onClose={() => setOpen(false)} onDone={(text) => { setOpen(false); setDone(text); reload(); }} />}
        {done && <p role="status" className="rounded-xl bg-[#E9F6EC] px-4 py-3 text-sm text-[#1F7A3A]">{done}</p>}
        {error && <p className="rounded-xl bg-[#FDECEC] px-4 py-3 text-sm text-[#B42318]">불러오지 못했어요: {error}</p>}
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
                  <td className="px-4 py-3">{p.role !== "owner" && <button onClick={() => toggle(p.id, !p.active)} className="h-8 rounded-lg border border-line px-2.5 text-xs font-semibold">{p.active ? "정지" : "다시 켜기"}</button>}</td>
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

const DONE = {
  invited: (e: string) => `${e}로 초대 메일을 보냈어요. 메일의 링크로 비밀번호를 만들고 인증 앱을 연결하면 로그인할 수 있어요.`,
  no_secret_key: (e: string) => `${e}을(를) 직원으로 등록했어요. 초대 메일은 아직 못 보내요: Supabase > Authentication > Users > Invite user에서 같은 이메일로 초대해 주세요. (서버에 SUPABASE_SECRET_KEY를 넣으면 자동으로 보내요)`,
  has_login: (e: string) => `${e}을(를) 직원으로 등록했어요. 이미 로그인 계정이 있어서 메일은 보내지 않았어요. 그 계정으로 바로 로그인하면 돼요.`,
  email_failed: (e: string) => `${e}을(를) 직원으로 등록했지만 초대 메일 발송에 실패했어요. Supabase > Authentication > Users에서 다시 초대해 주세요.`,
  sample: (e: string) => `${e}을(를) 등록했어요. (DB 미연결 · 개발용이라 메일은 보내지 않아요)`,
};

function InviteForm({ onClose, onDone }: { onClose: () => void; onDone: (text: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "staff">("staff");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const field = "h-10 w-full rounded-lg border border-line px-2.5 text-sm outline-none focus:border-brand";
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError("");
    const r = await inviteStaff(name, email, role);
    setBusy(false);
    if (typeof r === "string") return setError(r);
    onDone(DONE[r.invited ? "invited" : r.reason ?? "email_failed"](email.trim().toLowerCase()));
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl border border-brand bg-white p-5">
      <h2 className="font-bold">직원 초대</h2>
      <div className="flex flex-wrap gap-3">
        <label className="flex min-w-[160px] flex-1 flex-col gap-1.5 text-[13px] font-semibold">이름<input className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required /></label>
        <label className="flex min-w-[220px] flex-[2] flex-col gap-1.5 text-[13px] font-semibold">이메일<input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label className="flex min-w-[160px] flex-1 flex-col gap-1.5 text-[13px] font-semibold">권한
          <select className={field} value={role} onChange={(e) => setRole(e.target.value as "manager" | "staff")}>
            <option value="staff">{ROLE_LABEL.staff}</option><option value="manager">{ROLE_LABEL.manager}</option>
          </select>
        </label>
      </div>
      {error && <p className="text-sm text-[#B42318]">{error}</p>}
      <div className="flex gap-2">
        <button disabled={busy} className="h-10 rounded-xl bg-brand px-5 text-sm font-bold text-white disabled:opacity-60">{busy ? "보내는 중…" : "초대하기"}</button>
        <button type="button" onClick={onClose} className="h-10 rounded-xl border border-line px-4 text-sm font-semibold">취소</button>
      </div>
    </form>
  );
}
