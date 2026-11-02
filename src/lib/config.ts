// Business settings. Amounts marked TBD are placeholders until delivery quotes arrive.
// With Supabase these come from the app_settings table (owner can change them);
// the values here are the defaults and the sample-mode values.
export const SAME_DAY_CUTOFF_HOUR = 15; // order before 15:00 for same-day delivery
export const MIN_LEAD_HOURS = 3; // a delivery slot must start at least 3 hours after ordering
export const MAX_QTY_PER_ITEM = 10;
export const SERVICE_FEE_KRW = 4000; // TBD: candidate range 3,000-5,000 KRW
export const DELIVERY_FEE_KRW = 0; // TBD after courier quotes
export const DELIVERY_AREAS = ["myeongdong", "hongdae", "gangnam", "itaewon", "jamsil", "gwanghwamun"] as const;

export type Currency = "KRW" | "USD" | "JPY" | "CNY" | "TWD";
// Static demo rates (KRW per 1 unit). Replace with a live FX source in step 5.
export const FX: Record<Currency, number> = { KRW: 1, USD: 1380, JPY: 9.1, CNY: 190, TWD: 43 };
