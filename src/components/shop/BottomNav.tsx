"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import { useStore } from "@/lib/store";

export default function BottomNav() {
  const path = usePathname();
  const { m } = useStore();
  const items = [
    { href: "/", icon: "home", label: m.nav_home, on: path === "/" },
    { href: "/category/beauty", icon: "chart", label: m.nav_ranking, on: path.startsWith("/category") },
    { href: "/skin-match", icon: "face", label: m.nav_skin, on: path.startsWith("/skin-match") },
    { href: "/orders/lookup", icon: "truck", label: m.nav_orders, on: path.startsWith("/orders") },
  ];
  return (
    <nav className="sticky bottom-0 z-20 flex justify-around border-t border-line bg-white pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5">
      {items.map((x) => (
        <Link key={x.href} href={x.href} className={`flex h-12 w-[72px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${x.on ? "text-brand" : "text-sub"}`}>
          <Icon name={x.icon} />{x.label}
        </Link>
      ))}
    </nav>
  );
}
