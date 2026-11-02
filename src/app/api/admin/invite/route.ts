// POST /api/admin/invite — owner only. Adds a staff row and emails an invite.
// The staff row is written as the owner (database rules apply). Sending the
// invite email needs SUPABASE_SECRET_KEY on the server; without it the row is
// still added and the owner gets instructions to invite from Supabase.
import { z } from "zod";
import { adminClient, requireStaff, userClient } from "@/lib/server-auth";

const Body = z.object({
  name: z.string().trim().min(1).max(40),
  email: z.string().trim().toLowerCase().email().max(200),
  role: z.enum(["manager", "staff"]),
});

export async function POST(req: Request) {
  const auth = await requireStaff(req, ["owner"]);
  if (!auth.ok) return auth.res;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const { name, email, role } = parsed.data;
  if (!auth.token) return Response.json({ error: "not_configured" }, { status: 503 });

  const { error: insertError } = await userClient(auth.token).from("staff").insert({ name, email, role });
  if (insertError) {
    if (insertError.code === "23505") return Response.json({ error: "already_staff" }, { status: 409 });
    console.error("invite insert:", insertError.message);
    return Response.json({ error: "failed" }, { status: 500 });
  }

  const admin = adminClient();
  if (!admin) return Response.json({ invited: false, reason: "no_secret_key" });
  const origin = req.headers.get("origin") ?? new URL(req.url).origin;
  const { error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${origin}/admin/login?setup=1`, data: { name } });
  if (error) {
    // Someone who already has a login (e.g. was removed and re-added) just signs in.
    if (/already/i.test(error.message)) return Response.json({ invited: false, reason: "has_login" });
    console.error("invite email:", error.message);
    return Response.json({ invited: false, reason: "email_failed" });
  }
  return Response.json({ invited: true });
}
