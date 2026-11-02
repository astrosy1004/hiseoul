import { FX, type Currency } from "./config";
import type { Locale, LocalizedText } from "./types";

export function t(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.en;
}

export function krw(amount: number) {
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

export function price(amountKrw: number, currency: Currency, locale: Locale) {
  if (currency === "KRW") return locale === "ko" ? krw(amountKrw) : "₩" + new Intl.NumberFormat("en-US").format(amountKrw);
  const v = amountKrw / FX[currency];
  return new Intl.NumberFormat(locale === "ko" ? "ko-KR" : locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(v);
}
