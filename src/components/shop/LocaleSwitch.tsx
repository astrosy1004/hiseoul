"use client";
import { useStore } from "@/lib/store";
import { messages } from "@/lib/i18n";
import { LOCALES, type Locale } from "@/lib/types";

export default function LocaleSwitch({ dark = false }: { dark?: boolean }) {
  const { locale, setLocale } = useStore();
  return (
    <label className="relative">
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className={`h-10 appearance-none rounded-full border px-3 text-[13px] font-semibold ${dark ? "border-white/50 bg-transparent text-white" : "border-line bg-white text-ink"}`}
      >
        {LOCALES.map((l) => <option key={l} value={l} className="text-ink">{messages(l).langName}</option>)}
      </select>
    </label>
  );
}
