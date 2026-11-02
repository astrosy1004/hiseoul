import type { ReactNode } from "react";
export default function BottomCTA({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-0 z-10 border-t border-line bg-white px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-3">{children}</div>;
}
export const ctaClass = "flex h-[52px] w-full items-center justify-center rounded-xl bg-brand text-base font-bold text-white transition hover:bg-brand-dark disabled:opacity-40";
