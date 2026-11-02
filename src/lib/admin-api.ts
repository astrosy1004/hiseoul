// Browser helpers for the admin screens: calls to /api/admin/* with the
// signed-in staff member's session, and photo resizing before upload.
import type { Draft, DescribeRequest } from "./product-ai";
import { repo } from "./repo";
import { supabase } from "./supabase";
import type { StaffRole } from "./types";

async function post<T>(path: string, body: unknown): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) headers.authorization = `Bearer ${data.session.access_token}`;
  }
  try {
    const res = await fetch(path, { method: "POST", headers, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    return res.ok ? { ok: true, data: json as T } : { ok: false, status: res.status, error: json.error ?? "failed" };
  } catch {
    return { ok: false, status: 0, error: "network" };
  }
}

const DESCRIBE_ERRORS: Record<string, string> = {
  no_ai_key: "AI 키가 없어 자동 작성이 꺼져 있어요. .env.local에 ANTHROPIC_API_KEY를 넣고 다시 실행하세요.",
  need_photo_or_name: "사진을 올리거나 상품명을 먼저 적어 주세요.",
  ai_busy: "AI 요청이 몰렸어요. 잠시 후 다시 눌러 주세요.",
  signed_out: "로그인이 만료됐어요. 다시 로그인해 주세요.",
  forbidden: "상품 등록 권한이 없어요.",
  network: "서버에 연결하지 못했어요.",
};

export async function describeProduct(req: DescribeRequest): Promise<Draft | string> {
  const r = await post<Draft>("/api/admin/describe", req);
  return r.ok ? r.data : DESCRIBE_ERRORS[r.error] ?? "AI가 작성하지 못했어요. 직접 입력하거나 다시 시도해 주세요.";
}

export type InviteResult = { invited: boolean; reason?: "no_secret_key" | "has_login" | "email_failed" | "sample" };
const INVITE_ERRORS: Record<string, string> = {
  already_staff: "이미 등록된 이메일이에요.",
  bad_request: "이름과 이메일을 확인해 주세요.",
  signed_out: "로그인이 만료됐어요. 다시 로그인해 주세요.",
  forbidden: "대표만 직원을 초대할 수 있어요.",
  network: "서버에 연결하지 못했어요.",
};
export async function inviteStaff(name: string, email: string, role: Exclude<StaffRole, "owner">): Promise<InviteResult | string> {
  if (!supabase) {
    if ((await repo.listStaff()).some((s) => s.email === email.trim().toLowerCase())) return INVITE_ERRORS.already_staff;
    repo.addMockStaff({ name: name.trim(), email: email.trim().toLowerCase(), role });
    return { invited: false, reason: "sample" };
  }
  const r = await post<InviteResult>("/api/admin/invite", { name, email, role });
  return r.ok ? r.data : INVITE_ERRORS[r.error] ?? "초대하지 못했어요. 잠시 후 다시 해 주세요.";
}

/** Shrinks a photo to at most `max` px on the long side, as JPEG. */
export async function shrinkImage(file: Blob, max = 1200): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return new Promise((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error("encode"))), "image/jpeg", 0.85));
}

export function blobToBase64(b: Blob): Promise<string> {
  return new Promise((ok, fail) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1] ?? "");
    r.onerror = () => fail(r.error);
    r.readAsDataURL(b);
  });
}
