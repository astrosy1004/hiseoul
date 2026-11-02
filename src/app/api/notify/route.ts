// POST /api/notify {id} — emails the guest about the order's current status
// (confirmed, on the way, delivered). Anyone may call it: the database hands
// out each email once (claim_notification), so repeated calls send nothing.
// Needs SUPABASE_SECRET_KEY, RESEND_API_KEY and EMAIL_FROM; otherwise 204.
import { z } from "zod";
import { buildMail, emailConfigured, sendMail, type MailOrder } from "@/lib/email";
import { adminClient } from "@/lib/server-auth";

const Body = z.object({ id: z.string().trim().toUpperCase().regex(/^HS-\d{1,10}$/) });

export async function POST(req: Request) {
  const db = adminClient();
  if (!db || !emailConfigured()) return new Response(null, { status: 204 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });

  const { data, error } = await db.rpc("claim_notification", { p_id: parsed.data.id });
  if (error) { console.error("notify:", error.message); return Response.json({ error: "failed" }, { status: 500 }); }
  if (!data) return new Response(null, { status: 204 });
  const order = data as MailOrder & { prev: string | null };

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  const sent = await sendMail(order.email, buildMail(order, site.replace(/\/$/, "")));
  if (!sent) {
    // Put it back so the next status change (or a retry) can try again.
    await db.from("orders").update({ notified_status: order.prev }).eq("id", order.id);
    return Response.json({ sent: false }, { status: 502 });
  }
  return Response.json({ sent: true, status: order.status });
}
