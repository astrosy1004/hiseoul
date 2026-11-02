"use client";
import { useStore } from "@/lib/store";
export default function Footer() {
  const { t } = useStore();
  return <footer className="border-t border-pink-100 py-6 text-center text-xs text-gray-500">© HiSeoul · {t.demoNote}</footer>;
}
