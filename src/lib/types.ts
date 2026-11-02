// Domain types. These mirror the database tables planned for step 2 (Supabase).
export const LOCALES = ["en", "ja", "zh-CN", "zh-TW", "ko"] as const;
export type Locale = (typeof LOCALES)[number];

/** Text stored per language. English is required and used as the fallback. */
export type LocalizedText = { en: string } & Partial<Record<Exclude<Locale, "en">, string>>;

export type CategorySlug = "beauty" | "kpop" | "fashion";
export type Region = "all" | "japan" | "greater_china" | "sea" | "americas";

export type SkinType = "dry" | "oily" | "combination" | "sensitive";
export type SkinConcern = "acne" | "brightening" | "aging" | "pores" | "hydration";

export interface Product {
  id: string;
  category: CategorySlug;
  brand: LocalizedText;
  name: LocalizedText;
  description: LocalizedText;
  storePriceKrw: number; // sold at the same price as Korean stores
  imageUrl?: string; // our own photo, never copied from other stores
  rating: number;
  reviewCount: number;
  skinTypes?: SkinType[];
  concerns?: SkinConcern[];
  routineStep?: "toner" | "essence" | "cream" | "sun";
  visible: boolean; // admin toggle after checking Myeongdong stock
  stock: "in_stock" | "low" | "sold_out";
}

/** Daily ranking: our sales blended with Korean store charts, per traveler region. */
export interface RankingEntry {
  productId: string;
  region: Region;
  rank: number;
  change: number | "new"; // vs yesterday
}

export interface Hotel {
  id: string;
  name: LocalizedText;
  area: "myeongdong" | "hongdae" | "gangnam" | "itaewon" | "jamsil" | "gwanghwamun";
}

export type OrderStatus = "paid" | "purchased" | "delivering" | "delivered";
export const ORDER_FLOW: OrderStatus[] = ["paid", "purchased", "delivering", "delivered"];

export interface OrderLine { productId: string; qty: number; unitPriceKrw: number }

export interface Order {
  id: string;
  createdAt: string; // ISO
  email: string; // guest checkout: email only
  guestName: string; // name on the hotel reservation
  hotelId: string;
  room?: string;
  deliveryDate: string; // YYYY-MM-DD
  slot: DeliverySlot;
  lines: OrderLine[];
  itemsKrw: number;
  serviceFeeKrw: number;
  deliveryFeeKrw: number;
  totalKrw: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  handoverPhotoUrl?: string;
}

export type DeliverySlot = "12-15" | "15-18" | "18-21" | "21-23";
export type PaymentMethod = "card" | "alipay" | "wechatpay" | "paypay" | "linepay" | "grabpay";

export type StaffRole = "owner" | "manager" | "staff";
export interface Staff {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  mfaEnabled: boolean;
  active: boolean;
  lastLoginAt?: string;
}
