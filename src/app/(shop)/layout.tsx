"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Customer app: phone-width column. First-time visitors see the intro once. */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    try { if (!localStorage.getItem("hs.introSeen")) router.replace("/welcome"); } catch { /* ignore */ }
  }, [router]);
  return <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white sm:border-x sm:border-line">{children}</div>;
}
