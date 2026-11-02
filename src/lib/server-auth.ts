// Server routes for the admin screens. The browser sends the staff member's
// Supabase session token; we ask the database (staff_me) who that is, so the
// same rules apply as everywhere else: active staff + authenticator-app step.
import { createClient } from "@supabase/supabase-js";
import type { Staff, StaffRole } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type StaffAuth = { ok: true; staff: Staff; token?: string } | { ok: false; res: Response };

const deny = (status: number, error: string): StaffAuth => ({ ok: false, res: Response.json({ error }, { status }) });

export async function requireStaff(req: Request, roles: StaffRole[]): Promise<StaffAuth> {
  if (!url || !key) {
    // Sample mode (no database): only on the developer's own computer.
    if (process.env.NODE_ENV === "production") return deny(503, "not_configured");
    return { ok: true, staff: { id: "dev", name: "개발용", email: "owner@hiseoul.kr", role: "owner", active: true, mfaEnabled: true } };
  }
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return deny(401, "signed_out");
  const db = userClient(token);
  const { data, error } = await db.rpc("staff_me");
  const me = !error && Array.isArray(data) && data[0];
  if (!me) return deny(401, "signed_out");
  if (!roles.includes(me.role)) return deny(403, "forbidden");
  return { ok: true, token, staff: { id: me.id, name: me.name, email: me.email, role: me.role, active: me.active, mfaEnabled: true } };
}

/** Database client acting as the signed-in staff member (database rules apply). */
export function userClient(token: string) {
  return createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
}

/** Admin client with the secret key, or null when SUPABASE_SECRET_KEY is not set. Server only. */
export function adminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && secret ? createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}
