"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shop/BottomNav";
import TopBar from "@/components/shop/TopBar";
import { rememberLookup, repo } from "@/lib/repo";
import { useStore } from "@/lib/store";

export default function Lookup() {
  const { m } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [id, setId] = useState("");
  const [error, setError] = useState(false);
  // Links in our emails carry the order number.
  useEffect(() => { const q = new URLSearchParams(location.search).get("id"); if (q) setId(q); }, []);
  const input = "h-11 w-full rounded-xl border border-line px-3 text-[15px] outline-none focus:border-brand";
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const o = await repo.lookupOrder(id, email).catch(() => undefined);
    setBusy(false);
    if (!o) return setError(true);
    rememberLookup(o.id, email.trim());
    router.push(`/orders/${o.id}`);
  };
  return (
    <>
      <TopBar title={m.lookupTitle} />
      <form onSubmit={submit} className="flex flex-1 flex-col gap-4 px-5 pt-2">
        <p className="text-sm text-sub">{m.lookupDesc}</p>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Email<input type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yuki@example.com" /></label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">{m.orderNumber}<input className={input} value={id} onChange={(e) => setId(e.target.value)} placeholder="HS-1042" /></label>
        {error && <p className="text-sm text-[#B42318]">Not found</p>}
        <button disabled={busy} className="h-[52px] rounded-xl bg-brand font-bold text-white disabled:opacity-60">{m.find}</button>
      </form>
      <BottomNav />
    </>
  );
}
