// TEMPORARY development login. Step 2 replaces this with Supabase Auth
// (email + password + authenticator-app code, lockout after 5 failures).
import { repo } from "./repo";
import type { Staff } from "./types";

const KEY = "hs.admin";
export function getSession(): Staff | undefined {
  try { const id = sessionStorage.getItem(KEY); return repo.listStaff().find((s) => s.id === id && s.active); } catch { return undefined; }
}
export function signIn(email: string): Staff | undefined {
  const s = repo.listStaff().find((x) => x.email === email.trim().toLowerCase() && x.active);
  return s;
}
export function completeSignIn(s: Staff) { try { sessionStorage.setItem(KEY, s.id); } catch { /* ignore */ } }
export function signOut() { try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } }

export const ROLE_LABEL = { owner: "대표", manager: "운영 매니저", staff: "구매·배달 직원" } as const;
