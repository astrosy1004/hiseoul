"use client";
import BottomNav from "@/components/shop/BottomNav";
import TopBar from "@/components/shop/TopBar";
import { fill } from "@/lib/i18n";
import { useStore } from "@/lib/store";

// Built in step 4: 5 questions → routine (toner, essence, cream, sun) → share image.
export default function SkinMatch() {
  const { m } = useStore();
  return (
    <>
      <TopBar title={m.nav_skin} />
      <main className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
        <span className="text-xs font-bold text-brand">{m.skinBannerKicker}</span>
        <h1 className="text-xl font-bold">{m.skinBannerTitle}</h1>
        <p className="text-sm text-sub">{fill(m.comingSoon, { n: 4 })}</p>
      </main>
      <BottomNav />
    </>
  );
}
