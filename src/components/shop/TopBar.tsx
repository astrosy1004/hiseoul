"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import LocaleSwitch from "./LocaleSwitch";
import { useStore } from "@/lib/store";

/** Home shows the logo; inner pages show a back button and a title. */
export default function TopBar({ title, back }: { title?: string; back?: boolean }) {
  const router = useRouter();
  const { cart, m } = useStore();
  const count = cart.reduce((n, x) => n + x.qty, 0);
  return (
    <header className="sticky top-0 z-20 flex items-center gap-1 bg-white/95 px-3 py-2 backdrop-blur">
      {back ? (
        <button onClick={() => router.back()} aria-label="Back" className="flex h-11 w-11 items-center justify-center"><Icon name="back" /></button>
      ) : (
        <Link href="/" className="px-2 text-[22px] font-extrabold tracking-tight">Hi<span className="text-brand">Seoul</span></Link>
      )}
      {title && <h1 className="flex-1 truncate text-lg font-bold">{title}</h1>}
      <div className="ml-auto flex items-center gap-1">
        {!back && <LocaleSwitch />}
        <Link href="/search" aria-label={m.search} className="flex h-11 w-11 items-center justify-center"><Icon name="search" size={22} /></Link>
        <Link href="/cart" aria-label={m.cart} className="relative flex h-11 w-11 items-center justify-center">
          <Icon name="bag" size={24} />
          {count > 0 && <span className="absolute right-1 top-1 min-w-[18px] rounded-full bg-brand px-1 text-center text-[11px] font-bold leading-[18px] text-white">{count}</span>}
        </Link>
      </div>
    </header>
  );
}
