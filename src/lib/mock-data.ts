// Sample data for development. Step 2 moves this into Supabase tables.
// Brands and products are fictional placeholders.
import type { Hotel, Order, Product, RankingEntry, Region, Staff } from "./types";

const p = (x: Omit<Product, "visible" | "stock"> & Partial<Pick<Product, "visible" | "stock">>): Product => ({ visible: true, stock: "in_stock", ...x });

export const products: Product[] = [
  p({ id: "b1", category: "beauty", brand: { en: "Dewlab", ko: "듀랩" }, name: { en: "Snail Mucin 96 Essence 100ml", ko: "스네일 뮤신 96 에센스 100ml", ja: "スネイルムチン96エッセンス", "zh-CN": "蜗牛黏液96精华", "zh-TW": "蝸牛黏液96精華" }, description: { en: "Lightweight essence with 96% snail secretion filtrate that hydrates dry, sensitive skin.", ko: "달팽이 점액 여과물 96%로 건조하고 예민한 피부에 수분을 채워 주는 가벼운 에센스." }, storePriceKrw: 21000, rating: 4.8, reviewCount: 12840, skinTypes: ["dry", "combination", "sensitive"], concerns: ["hydration", "aging"], routineStep: "essence" }),
  p({ id: "b2", category: "beauty", brand: { en: "Sun Daily", ko: "선데일리" }, name: { en: "Watery Sun Cream SPF50+", ko: "워터리 선크림 SPF50+" }, description: { en: "No white cast, no stickiness.", ko: "백탁 없이 산뜻한 데일리 선크림." }, storePriceKrw: 15000, rating: 4.8, reviewCount: 20113, skinTypes: ["dry", "oily", "combination", "sensitive"], concerns: ["aging", "brightening"], routineStep: "sun" }),
  p({ id: "b3", category: "beauty", brand: { en: "Cica Garden", ko: "시카가든" }, name: { en: "Centella Calming Cream", ko: "센텔라 진정 크림" }, description: { en: "Soothes redness and strengthens the skin barrier.", ko: "붉은기를 진정시키고 피부 장벽을 강화해요." }, storePriceKrw: 24000, rating: 4.9, reviewCount: 15011, skinTypes: ["sensitive", "combination", "dry"], concerns: ["acne", "hydration"], routineStep: "cream" }),
  p({ id: "b4", category: "beauty", brand: { en: "Seoul Glow", ko: "서울글로우" }, name: { en: "Rice Water Brightening Toner", ko: "쌀뜨물 브라이트닝 토너" }, description: { en: "Fermented rice toner for an even, glassy tone.", ko: "발효 쌀 성분으로 맑고 고른 피부 톤." }, storePriceKrw: 18000, rating: 4.7, reviewCount: 8320, skinTypes: ["dry", "oily", "combination"], concerns: ["brightening"], routineStep: "toner" }),
  p({ id: "b5", category: "beauty", brand: { en: "Pore Hero", ko: "포어히어로" }, name: { en: "BHA Blackhead Pads (70)", ko: "BHA 블랙헤드 패드 70매" }, description: { en: "Gentle daily exfoliating pads for clear pores.", ko: "매일 쓰는 순한 각질 패드." }, storePriceKrw: 16000, rating: 4.7, reviewCount: 9302, skinTypes: ["oily", "combination"], concerns: ["pores", "acne"], routineStep: "toner", stock: "low" }),
  p({ id: "b6", category: "beauty", brand: { en: "Tint Studio", ko: "틴트스튜디오" }, name: { en: "Glass Lip Tint Set", ko: "글래스 립 틴트 세트" }, description: { en: "Three juicy colors in one set.", ko: "물기 가득한 3가지 컬러 세트." }, storePriceKrw: 22000, rating: 4.6, reviewCount: 6120 }),
  p({ id: "b7", category: "beauty", brand: { en: "Hanbang Lab", ko: "한방랩" }, name: { en: "Ginseng Firming Serum", ko: "인삼 탄력 세럼" }, description: { en: "Korean herbal serum for elasticity.", ko: "인삼 성분의 탄력 세럼." }, storePriceKrw: 45000, rating: 4.6, reviewCount: 4210, skinTypes: ["dry", "combination"], concerns: ["aging"], routineStep: "essence" }),
  p({ id: "b8", category: "beauty", brand: { en: "Mask Day", ko: "마스크데이" }, name: { en: "Sheet Mask 30-Day Pack", ko: "시트 마스크 30일 팩" }, description: { en: "30 masks, 6 formulas.", ko: "6가지 포뮬러, 30장." }, storePriceKrw: 30000, rating: 4.5, reviewCount: 3880, stock: "sold_out", visible: false }),
  p({ id: "k1", category: "kpop", brand: { en: "Starlight Ent.", ko: "스타라이트" }, name: { en: "New Mini Album (Random Ver.)", ko: "신규 미니앨범 (랜덤)" }, description: { en: "Photobook, random photocard and poster included.", ko: "포토북, 랜덤 포토카드, 포스터 포함." }, storePriceKrw: 19800, rating: 4.8, reviewCount: 18320 }),
  p({ id: "k2", category: "kpop", brand: { en: "Starlight Ent.", ko: "스타라이트" }, name: { en: "Official Light Stick Ver.3", ko: "공식 응원봉 Ver.3" }, description: { en: "Bluetooth-synced light stick.", ko: "블루투스 연동 응원봉." }, storePriceKrw: 55000, rating: 4.9, reviewCount: 7210, stock: "low" }),
  p({ id: "k3", category: "kpop", brand: { en: "Idol Goods", ko: "아이돌굿즈" }, name: { en: "Photocard Binder", ko: "포토카드 바인더" }, description: { en: "Protect and show off your collection.", ko: "포토카드 보관 바인더." }, storePriceKrw: 14000, rating: 4.7, reviewCount: 5320 }),
  p({ id: "f1", category: "fashion", brand: { en: "Seongsu Studio", ko: "성수스튜디오" }, name: { en: "Oversized Logo Hoodie", ko: "오버핏 로고 후디" }, description: { en: "The Seongsu-dong look.", ko: "성수동 감성 후디." }, storePriceKrw: 59000, rating: 4.6, reviewCount: 3120 }),
  p({ id: "f2", category: "fashion", brand: { en: "Hanok Wear", ko: "한옥웨어" }, name: { en: "Modern Hanbok Jacket", ko: "모던 한복 재킷" }, description: { en: "Traditional lines, everyday comfort.", ko: "전통 라인의 데일리 재킷." }, storePriceKrw: 89000, rating: 4.8, reviewCount: 1210 }),
  p({ id: "f3", category: "fashion", brand: { en: "Seongsu Studio", ko: "성수스튜디오" }, name: { en: "Bucket Hat", ko: "버킷햇" }, description: { en: "Lightweight and easy to pack.", ko: "가볍고 챙기기 쉬운 버킷햇." }, storePriceKrw: 29000, rating: 4.4, reviewCount: 1950 }),
];

const order: Record<Region, string[]> = {
  all: ["b1", "b2", "b3", "k1", "b4", "b5", "f1", "k2", "b6", "b7"],
  japan: ["b1", "b3", "b2", "b6", "k1", "b4", "b5", "k3", "f3", "b7"],
  greater_china: ["b7", "b1", "b2", "b3", "f2", "b4", "k2", "b6", "b5", "k1"],
  sea: ["b2", "b1", "k1", "b5", "b3", "k2", "b4", "f1", "k3", "b6"],
  americas: ["b1", "b2", "f2", "b3", "k1", "b4", "f1", "b5", "k2", "f3"],
};
const changes: (number | "new")[] = [3, 0, 1, "new", -1, 2, 0, 5, -2, 0];

export const rankings: RankingEntry[] = (Object.keys(order) as Region[]).flatMap((region) =>
  order[region].map((productId, i) => ({ productId, region, rank: i + 1, change: changes[i] })),
);

export const hotels: Hotel[] = [
  { id: "h1", name: { en: "Lotte Hotel Seoul", ko: "롯데호텔 서울" }, area: "myeongdong" },
  { id: "h2", name: { en: "Ibis Styles Myeongdong", ko: "이비스 스타일 명동" }, area: "myeongdong" },
  { id: "h3", name: { en: "Four Seasons Hotel Seoul", ko: "포시즌스 호텔 서울" }, area: "gwanghwamun" },
  { id: "h4", name: { en: "L7 Hongdae", ko: "L7 홍대" }, area: "hongdae" },
  { id: "h5", name: { en: "Grand Hyatt Seoul", ko: "그랜드 하얏트 서울" }, area: "itaewon" },
  { id: "h6", name: { en: "Josun Palace", ko: "조선 팰리스" }, area: "gangnam" },
  { id: "h7", name: { en: "Signiel Seoul", ko: "시그니엘 서울" }, area: "jamsil" },
];

export const staff: Staff[] = [
  { id: "s1", name: "김수연", email: "owner@hiseoul.kr", role: "owner", mfaEnabled: true, active: true, lastLoginAt: "2026-11-02T09:12:00+09:00" },
  { id: "s2", name: "운영 매니저 A", email: "manager@hiseoul.kr", role: "manager", mfaEnabled: true, active: true, lastLoginAt: "2026-11-02T08:40:00+09:00" },
  { id: "s3", name: "구매 직원 B", email: "buyer@hiseoul.kr", role: "staff", mfaEnabled: true, active: true, lastLoginAt: "2026-11-01T21:05:00+09:00" },
  { id: "s4", name: "구매 직원 C", email: "staff2@hiseoul.kr", role: "staff", mfaEnabled: false, active: false },
];

export const sampleOrders: Order[] = [
  { id: "HS-1042", createdAt: "2026-11-02T11:20:00+09:00", email: "yuki@example.com", guestName: "Yuki T.", hotelId: "h1", deliveryDate: "2026-11-02", slot: "18-21", lines: [{ productId: "b1", qty: 1, unitPriceKrw: 21000 }, { productId: "b2", qty: 2, unitPriceKrw: 15000 }], itemsKrw: 51000, serviceFeeKrw: 4000, deliveryFeeKrw: 0, totalKrw: 55000, paymentMethod: "paypay", status: "paid" },
  { id: "HS-1039", createdAt: "2026-11-02T10:02:00+09:00", email: "sarah@example.com", guestName: "Sarah K.", hotelId: "h4", deliveryDate: "2026-11-02", slot: "15-18", lines: [{ productId: "k1", qty: 2, unitPriceKrw: 19800 }], itemsKrw: 39600, serviceFeeKrw: 4000, deliveryFeeKrw: 0, totalKrw: 43600, paymentMethod: "card", status: "purchased" },
  { id: "HS-1035", createdAt: "2026-11-02T09:15:00+09:00", email: "emily@example.com", guestName: "Emily R.", hotelId: "h5", deliveryDate: "2026-11-02", slot: "15-18", lines: [{ productId: "b3", qty: 1, unitPriceKrw: 24000 }], itemsKrw: 24000, serviceFeeKrw: 4000, deliveryFeeKrw: 0, totalKrw: 28000, paymentMethod: "card", status: "delivering" },
  { id: "HS-1031", createdAt: "2026-11-02T08:01:00+09:00", email: "mei@example.com", guestName: "Mei C.", hotelId: "h6", deliveryDate: "2026-11-02", slot: "12-15", lines: [{ productId: "b7", qty: 1, unitPriceKrw: 45000 }], itemsKrw: 45000, serviceFeeKrw: 4000, deliveryFeeKrw: 0, totalKrw: 49000, paymentMethod: "alipay", status: "delivered" },
];
