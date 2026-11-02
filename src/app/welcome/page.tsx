"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import LocaleSwitch from "@/components/shop/LocaleSwitch";
import { fill } from "@/lib/i18n";
import { useStore } from "@/lib/store";

// Han River skyline at sunset (owner-supplied hi.png). Each slide frames a
// different part of the same photo; add more photos in /public/intro later.
const PHOTOS: { src?: string; pos?: string; what: string }[] = [
  { src: "/intro/seoul.jpg", pos: "20% 50%", what: "Han River bridges at sunset" },
  { src: "/intro/seoul.jpg", pos: "50% 50%", what: "Seoul skyline" },
  { src: "/intro/seoul.jpg", pos: "68% 50%", what: "N Seoul Tower over the city" },
];

export default function Welcome() {
  const { m } = useStore();
  const router = useRouter();
  const [i, setI] = useState(0);
  const slides = [
    { k: m.intro1_k, t: m.intro1_t, b: m.intro1_b },
    { k: m.intro2_k, t: m.intro2_t, b: m.intro2_b },
    { k: m.intro3_k, t: m.intro3_t, b: m.intro3_b },
  ];
  const done = () => { try { localStorage.setItem("hs.introSeen", "1"); } catch { /* ignore */ } router.replace("/"); };
  const s = slides[i];
  const photo = PHOTOS[i];
  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white sm:border-x sm:border-line">
      <div className="relative h-[56vh] min-h-[360px] bg-[#2A2A2E]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {photo.src ? <img src={photo.src} alt={photo.what} style={{ objectPosition: photo.pos }} className="h-full w-full object-cover transition-[object-position] duration-700" /> : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center text-[#D9D9DE]">
            <Icon name="image" size={36} />
            <span className="text-sm">{fill(m.photoSlot, { what: photo.what })}</span>
          </div>
        )}
        {photo.src && <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />}
        <div className="absolute inset-x-5 top-4 flex items-center justify-between">
          <span className="text-xl font-extrabold text-white">Hi<span className="text-[#F7A8C4]">Seoul</span></span>
          <LocaleSwitch dark />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 px-6 pt-7">
        <span className="text-[13px] font-bold text-brand">{s.k}</span>
        <h1 className="whitespace-pre-line text-[26px] font-extrabold leading-snug">{s.t}</h1>
        <p className="text-[15px] leading-relaxed text-sub">{s.b}</p>
      </div>
      <div className="flex flex-col gap-4 px-6 pb-7">
        <div className="flex justify-center gap-2">
          {slides.map((_, k) => (
            <button key={k} aria-label={`${k + 1}`} onClick={() => setI(k)} className={`h-2 rounded-full transition-all ${k === i ? "w-6 bg-brand" : "w-2 bg-line"}`} />
          ))}
        </div>
        {i === slides.length - 1 ? (
          <button onClick={done} className="h-[52px] rounded-xl bg-brand text-base font-bold text-white">{m.start}</button>
        ) : (
          <div className="flex gap-2.5">
            <button onClick={done} className="h-[52px] flex-1 rounded-xl border border-line text-[15px] font-semibold text-sub">{m.skipIntro}</button>
            <button onClick={() => setI(i + 1)} className="h-[52px] flex-[2] rounded-xl bg-brand text-base font-bold text-white">{m.next}</button>
          </div>
        )}
      </div>
    </div>
  );
}
