"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getSession, ROLE_LABEL, signOut } from "@/lib/admin-session";
import type { Staff } from "@/lib/types";

const NAV = [
  { href: "/admin", label: "오늘 주문", roles: ["owner", "manager", "staff"] },
  { href: "/admin/products", label: "상품·랭킹", roles: ["owner", "manager"] },
  { href: "/admin/accounts", label: "직원 계정", roles: ["owner"] },
] as const;

export default function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Staff | null | undefined>(undefined);
  useEffect(() => {
    const s = getSession();
    setMe(s ?? null);
    if (!s) router.replace("/admin/login");
  }, [router, path]);
  if (!me) return <div className="min-h-dvh bg-soft" />;
  const nav = NAV.filter((n) => (n.roles as readonly string[]).includes(me.role));
  const allowed = nav.some((n) => n.href === path);
  return (
    <div className="flex min-h-dvh flex-wrap bg-soft">
      <aside className="flex w-full flex-col gap-1 border-b border-line bg-white p-4 md:min-h-dvh md:w-60 md:border-b-0 md:border-r">
        <div className="px-2 pb-4 text-xl font-extrabold">Hi<span className="text-brand">Seoul</span> <span className="text-xs font-semibold text-sub">관리자</span></div>
        <nav className="flex flex-wrap gap-1 md:flex-col">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${path === n.href ? "bg-brand-soft text-brand" : "text-ink hover:bg-soft"}`}>{n.label}</Link>
          ))}
        </nav>
        <div className="mt-auto hidden flex-col gap-1 px-3 pt-6 text-xs text-sub md:flex">
          <span className="font-semibold text-ink">{me.name}</span><span>{ROLE_LABEL[me.role]}</span>
          <button onClick={() => { signOut(); router.replace("/admin/login"); }} className="mt-2 self-start font-semibold text-sub underline">로그아웃</button>
        </div>
      </aside>
      <main className="min-w-0 flex-[999_1_560px] p-6 md:p-8">
        {allowed ? children : <p className="text-sub">이 화면을 볼 권한이 없어요.</p>}
      </main>
    </div>
  );
}
