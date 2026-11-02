"use client";
// Privacy policy (draft). Korean law (PIPA) requires one before taking real
// orders; have it reviewed before launch. Shown in Korean for ko, English otherwise.
import TopBar from "@/components/shop/TopBar";
import { useStore } from "@/lib/store";

type Section = [string, string[]];

const EN: Section[] = [
  ["What we collect", ["Name on your hotel reservation, email, hotel and room number, delivery time, items ordered and payment status. We do not store card numbers; the payment company handles them."]],
  ["Why", ["To buy your items, deliver them to your hotel front desk, email you order updates and answer your questions."]],
  ["Who helps us", ["Supabase (database), Vercel (website hosting), Resend (email), Anthropic (AI text for Skin Match and product descriptions; your personal details are not sent), and our payment company. Some of them store data outside Korea."]],
  ["How long", ["Order records are kept for 5 years as required by Korean e-commerce law, then deleted. Front-desk handover photos are kept only as long as needed for delivery questions."]],
  ["Your choices", ["You can ask to see, correct or delete your details by emailing us. Skin Match answers stay on your phone unless you share them."]],
  ["Contact", ["privacy@hiseoul.kr (draft address — replace before launch)"]],
];
const KO: Section[] = [
  ["수집하는 정보", ["호텔 예약자 이름, 이메일, 호텔과 객실 번호, 배달 시간, 주문 상품, 결제 상태. 카드 번호는 저장하지 않으며 결제사가 처리해요."]],
  ["이용 목적", ["상품 구매, 호텔 프런트 배달, 주문 진행 메일 발송, 문의 응대."]],
  ["처리 위탁", ["Supabase(데이터베이스), Vercel(웹 호스팅), Resend(이메일), Anthropic(Skin Match·상품 설명 AI, 개인정보는 보내지 않음), 결제사. 일부는 국외에 저장돼요."]],
  ["보관 기간", ["주문 기록은 전자상거래법에 따라 5년 보관 후 삭제해요. 프런트 전달 사진은 배달 문의 처리에 필요한 기간만 보관해요."]],
  ["이용자 권리", ["이메일로 열람·정정·삭제를 요청할 수 있어요. Skin Match 답변은 공유하지 않는 한 휴대폰에만 저장돼요."]],
  ["문의", ["privacy@hiseoul.kr (임시 주소 — 출시 전에 바꿔 주세요)"]],
];

export default function Privacy() {
  const { m, locale } = useStore();
  const body = locale === "ko" ? KO : EN;
  return (
    <>
      <TopBar back title={m.privacy} />
      <main className="flex flex-col gap-5 px-5 pb-10 text-sm leading-relaxed">
        <p className="text-xs text-mute">Draft · 2026-11</p>
        {body.map(([h, ps]) => (
          <section key={h}>
            <h2 className="mb-1 font-bold">{h}</h2>
            {ps.map((p) => <p key={p} className="text-sub">{p}</p>)}
          </section>
        ))}
      </main>
    </>
  );
}
