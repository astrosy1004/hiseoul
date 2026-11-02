"use client";
import { price } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function Price({ krw, className = "" }: { krw: number; className?: string }) {
  const { currency, locale } = useStore();
  return <span className={className}>{price(krw, currency, locale)}</span>;
}
