// Admin sign-in.
// With Supabase: email + password, then a 6-digit code from an authenticator
// app (Google Authenticator, 1Password, ...). First login sets the app up with
// a QR code. Database rules only trust sessions that passed the code step.
// Without Supabase: development login (any password, any 6 digits).
import { repo } from "./repo";
import { supabase } from "./supabase";
import type { Staff } from "./types";

export const ROLE_LABEL = { owner: "대표", manager: "운영 매니저", staff: "구매·배달 직원" } as const;

export type SignInStep =
  | { ok: false; error: string }
  | { ok: true; factorId: string; enroll?: { qr: string; secret: string } };

const KEY = "hs.admin";
let cached: Staff | null | undefined;

/** Step 1: email + password. */
export async function startSignIn(email: string, password: string): Promise<SignInStep> {
  const mail = email.trim().toLowerCase();
  if (!supabase) {
    const s = (await repo.listStaff()).find((x) => x.email === mail && x.active);
    return s && password ? { ok: true, factorId: s.id } : { ok: false, error: "이메일 또는 비밀번호를 확인하세요." };
  }
  const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
  if (error) {
    const code = (error as { code?: string }).code;
    if (error.status === 429) return { ok: false, error: "시도가 너무 많아요. 잠시 후 다시 해 주세요." };
    if (code === "email_not_confirmed") return { ok: false, error: "이메일 확인이 안 된 계정이에요. Supabase > Authentication > Users에서 계정을 확인(Confirm) 처리해 주세요." };
    if (code === "invalid_credentials") return { ok: false, error: "이메일 또는 비밀번호가 맞지 않아요. (비밀번호는 6자 이상)" };
    if (!error.status) return { ok: false, error: "Supabase에 접속하지 못했어요. .env.local의 주소를 확인하세요." };
    if (error.status === 401 || /api key/i.test(error.message)) return { ok: false, error: "Supabase 키가 맞지 않아요. .env.local의 Publishable key를 확인하세요." };
    return { ok: false, error: `로그인하지 못했어요: ${error.message}` };
  }
  const { data: f, error: fe } = await supabase.auth.mfa.listFactors();
  if (fe) return { ok: false, error: fe.message };
  const totp = f.totp.find((x) => x.status === "verified");
  if (totp) return { ok: true, factorId: totp.id };
  // First login: clear half-finished setups, then show a new QR code.
  for (const x of f.all.filter((x) => x.factor_type === "totp" && x.status !== "verified")) await supabase.auth.mfa.unenroll({ factorId: x.id });
  const { data: en, error: ee } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "HiSeoul admin" });
  if (ee) return { ok: false, error: ee.message };
  return { ok: true, factorId: en.id, enroll: { qr: en.totp.qr_code, secret: en.totp.secret } };
}

/** Step 2: 6-digit code. Returns the staff profile, or an error message. */
export async function verifyCode(factorId: string, code: string): Promise<Staff | string> {
  if (!/^\d{6}$/.test(code)) return "6자리 숫자를 입력하세요.";
  if (!supabase) {
    const s = (await repo.listStaff()).find((x) => x.id === factorId);
    if (!s) return "다시 로그인해 주세요.";
    try { sessionStorage.setItem(KEY, s.id); } catch { /* ignore */ }
    return (cached = s);
  }
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) return "코드가 맞지 않아요. 앱에 표시된 최신 코드를 입력하세요.";
  const { data, error: se } = await supabase.rpc("staff_me");
  const me = !se && Array.isArray(data) && data[0];
  if (!me) { await supabase.auth.signOut(); return "직원으로 등록되지 않았거나 정지된 계정이에요. 대표에게 문의하세요."; }
  return (cached = { id: me.id, name: me.name, email: me.email, role: me.role, active: me.active, mfaEnabled: true, lastLoginAt: me.last_login_at });
}

/** Current signed-in staff member, or null. */
export async function getSession(): Promise<Staff | null> {
  if (cached !== undefined) return cached;
  if (!supabase) {
    let id: string | null = null;
    try { id = sessionStorage.getItem(KEY); } catch { /* ignore */ }
    return (cached = (await repo.listStaff()).find((s) => s.id === id && s.active) ?? null);
  }
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") return (cached = null);
  const { data } = await supabase.rpc("staff_me");
  const me = Array.isArray(data) && data[0];
  return (cached = me ? { id: me.id, name: me.name, email: me.email, role: me.role, active: me.active, mfaEnabled: true, lastLoginAt: me.last_login_at } : null);
}

export async function signOut() {
  cached = undefined;
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  if (supabase) await supabase.auth.signOut();
}
