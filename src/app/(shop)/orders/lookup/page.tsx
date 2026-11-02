"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shop/BottomNav";
import TopBar from "@/components/shop/TopBar";
import { repo } from "@/lib/repo";
import { useStore } from "@/lib/store";

export default function Lookup() {
  const { m } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [id, setId] = useState("");
  const [error, setError] = useState(false);
  const input = "h-11 w-full rounded-xl border border-line px-3 text-[15px] outline-none focus:border-brand";
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const o = repo.listOrders().find((x) => x.id.toLowerCase() === id.trim().toLowerCase() && x.email.toLowerCase() === email.trim().toLowerCase());
    if (o) router.push(`/orders/${o.id}`); else setError(true);
  };
  return (
    <>
      <TopBar title={m.lookupTitle} />
      <form onSubmit={submit} className="flex flex-1 flex-col gap-4 px-5 pt-2">
        <p className="text-sm text-sub">{m.lookupDesc}</p>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Email<input type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yuki@example.com" /></label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">{m.orderNumber}<input className={input} value={id} onChange={(e) => setId(e.target.value)} placeholder="HS-1042" /></label>
        {error && <p className="text-sm text-[#B42318]">Not found</p>}
        <button className="h-[52px] rounded-xl bg-brand font-bold text-white">{m.find}</button>
      </form>
      <BottomNav />
    </>
  );
}
