"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeSignIn, signIn } from "@/lib/admin-session";
import type { Staff } from "@/lib/types";

const input = "h-11 w-full rounded-xl border border-line px-3 text-[15px] outline-none focus:border-brand";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@hiseoul.kr");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState<Staff>();
  const [error, setError] = useState("");
  return (
    <div className="flex min-h-dvh items-center justify-center bg-soft px-4 py-10">
      <div className="flex w-full max-w-[400px] flex-col gap-4 rounded-2xl border border-line bg-white px-8 py-9">
        <div className="pb-2">
          <div className="text-2xl font-extrabold">Hi<span className="text-brand">Seoul</span> <span className="text-sm font-semibold text-sub">관리자</span></div>
          <p className="mt-1 text-[13px] text-sub">초대받은 직원 계정으로 로그인하세요.</p>
        </div>
        {!pending ? (
          <form className="flex flex-col gap-3.5" onSubmit={(e) => { e.preventDefault(); const s = signIn(email); if (s && pw) { setPending(s); setError(""); } else setError("이메일 또는 비밀번호를 확인하세요."); }}>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">이메일<input className={input} value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" /></label>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">비밀번호<input className={input} value={pw} onChange={(e) => setPw(e.target.value)} type="password" autoComplete="current-password" /></label>
            {error && <p className="text-sm text-[#B42318]">{error}</p>}
            <button className="h-12 rounded-xl bg-brand font-bold text-white">로그인</button>
          </form>
        ) : (
          <form className="flex flex-col gap-3.5" onSubmit={(e) => { e.preventDefault(); if (/^\d{6}$/.test(code)) { completeSignIn(pending); router.replace("/admin"); } else setError("6자리 숫자를 입력하세요."); }}>
            <div className="rounded-xl bg-brand-soft px-3.5 py-3 text-[13px] text-brand-ink">휴대폰 인증 앱에 표시된 6자리 코드를 입력하세요.</div>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">인증 코드<input className={`${input} text-center text-xl font-semibold tracking-[6px]`} value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} placeholder="000000" autoComplete="one-time-code" /></label>
            {error && <p className="text-sm text-[#B42318]">{error}</p>}
            <button className="h-12 rounded-xl bg-brand font-bold text-white">확인</button>
            <button type="button" onClick={() => { setPending(undefined); setCode(""); }} className="text-[13px] font-semibold text-sub">다른 계정으로 로그인</button>
          </form>
        )}
        <p className="text-center text-xs text-mute">개발용 임시 로그인 · 2단계에서 실제 인증으로 교체</p>
      </div>
    </div>
  );
}
