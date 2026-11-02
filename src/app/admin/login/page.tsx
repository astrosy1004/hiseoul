"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { linkSignIn, sendPasswordLink, setPassword, startSignIn, verifyCode, type SignInStep } from "@/lib/admin-session";
import { usingSupabase } from "@/lib/supabase";

const input = "h-11 w-full rounded-xl border border-line px-3 text-[15px] outline-none focus:border-brand";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState(usingSupabase ? "" : "owner@hiseoul.kr");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string>();
  const [enroll, setEnroll] = useState<{ qr: string; secret: string }>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // From an invite / reset email: choose a password first.
  const [linkEmail, setLinkEmail] = useState<string | null>(null);
  const [pw2, setPw2] = useState("");
  const [info, setInfo] = useState("");
  useEffect(() => { linkSignIn().then((e) => { if (e) { setLinkEmail(e); setEmail(e); } }); }, []);

  const next = (r: SignInStep) => {
    if (!r.ok) return setError(r.error);
    setFactorId(r.factorId); setEnroll(r.enroll); setLinkEmail(null);
  };
  const choosePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (pw !== pw2) return setError("두 비밀번호가 달라요.");
    setBusy(true); const r = await setPassword(pw); setBusy(false); next(r);
  };
  const forgot = async () => {
    setError(""); setInfo("");
    if (!email.trim()) return setError("이메일을 먼저 적어 주세요.");
    setBusy(true); const err = await sendPasswordLink(email); setBusy(false);
    if (err) setError(err); else setInfo(`${email.trim()}로 비밀번호 설정 링크를 보냈어요. 메일을 확인하세요.`);
  };

  const step1 = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError("");
    const r = await startSignIn(email, pw);
    setBusy(false);
    next(r);
  };
  const step2 = async (e: React.FormEvent) => {
    e.preventDefault(); if (!factorId) return;
    setBusy(true); setError("");
    const r = await verifyCode(factorId, code);
    setBusy(false);
    if (typeof r === "string") return setError(r);
    router.replace("/admin");
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-soft px-4 py-10">
      <div className="flex w-full max-w-[400px] flex-col gap-4 rounded-2xl border border-line bg-white px-8 py-9">
        <div className="pb-2">
          <div className="text-2xl font-extrabold">Hi<span className="text-brand">Seoul</span> <span className="text-sm font-semibold text-sub">관리자</span></div>
          <p className="mt-1 text-[13px] text-sub">초대받은 직원 계정으로 로그인하세요.</p>
        </div>
        {linkEmail && !factorId ? (
          <form className="flex flex-col gap-3.5" onSubmit={choosePassword}>
            <div className="rounded-xl bg-brand-soft px-3.5 py-3 text-[13px] text-brand-ink"><b>{linkEmail}</b> 계정의 비밀번호를 만들어 주세요. 다음 단계에서 인증 앱을 연결해요.</div>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">새 비밀번호 (8자 이상)<input className={input} value={pw} onChange={(e) => setPw(e.target.value)} type="password" autoComplete="new-password" minLength={8} required autoFocus /></label>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">한 번 더<input className={input} value={pw2} onChange={(e) => setPw2(e.target.value)} type="password" autoComplete="new-password" required /></label>
            {error && <p className="text-sm text-[#B42318]">{error}</p>}
            <button disabled={busy} className="h-12 rounded-xl bg-brand font-bold text-white disabled:opacity-60">{busy ? "저장 중…" : "비밀번호 저장"}</button>
          </form>
        ) : !factorId ? (
          <form className="flex flex-col gap-3.5" onSubmit={step1}>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">이메일<input className={input} value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" required /></label>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">비밀번호<input className={input} value={pw} onChange={(e) => setPw(e.target.value)} type="password" autoComplete="current-password" required /></label>
            {error && <p className="text-sm text-[#B42318]">{error}</p>}
            {info && <p role="status" className="text-sm text-[#1F7A3A]">{info}</p>}
            <button disabled={busy} className="h-12 rounded-xl bg-brand font-bold text-white disabled:opacity-60">{busy ? "확인 중…" : "로그인"}</button>
            {usingSupabase && <button type="button" onClick={forgot} disabled={busy} className="text-[13px] font-semibold text-sub">비밀번호를 잊었어요</button>}
          </form>
        ) : (
          <form className="flex flex-col gap-3.5" onSubmit={step2}>
            {enroll ? (
              <div className="flex flex-col items-center gap-2 rounded-xl bg-brand-soft px-3.5 py-4 text-center text-[13px] text-brand-ink">
                <span className="font-bold">처음 로그인이에요. 인증 앱을 연결해 주세요.</span>
                <span>Google Authenticator 같은 인증 앱으로 아래 QR을 찍은 뒤, 앱에 나온 6자리를 입력하세요.</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={enroll.qr} alt="인증 앱 연결용 QR 코드" width={168} height={168} className="rounded-lg bg-white p-2" />
                <span className="text-xs">QR을 못 찍으면 직접 입력: <code className="break-all font-semibold">{enroll.secret}</code></span>
              </div>
            ) : (
              <div className="rounded-xl bg-brand-soft px-3.5 py-3 text-[13px] text-brand-ink">휴대폰 인증 앱에 표시된 6자리 코드를 입력하세요.</div>
            )}
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">인증 코드<input className={`${input} text-center text-xl font-semibold tracking-[6px]`} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={6} placeholder="000000" autoComplete="one-time-code" autoFocus /></label>
            {error && <p className="text-sm text-[#B42318]">{error}</p>}
            <button disabled={busy} className="h-12 rounded-xl bg-brand font-bold text-white disabled:opacity-60">{busy ? "확인 중…" : "확인"}</button>
            <button type="button" onClick={() => { setFactorId(undefined); setEnroll(undefined); setCode(""); setError(""); }} className="text-[13px] font-semibold text-sub">다른 계정으로 로그인</button>
          </form>
        )}
        {!usingSupabase && <p className="text-center text-xs text-mute">DB 미연결 · 개발용 로그인 (아무 비밀번호 + 아무 6자리)</p>}
      </div>
    </div>
  );
}
