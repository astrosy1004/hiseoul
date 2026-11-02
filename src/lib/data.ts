// Mock catalog. Replace with a real catalog/API (partner stores, wholesale) later.
export type CategorySlug = "beauty" | "kpop" | "fashion" | "snack" | "wellness";

export interface Category {
  slug: CategorySlug;
  emoji: string;
  gradient: string;
}

export const categories: Category[] = [
  { slug: "beauty", emoji: "💄", gradient: "from-pink-400 to-rose-500" },
  { slug: "kpop", emoji: "🎤", gradient: "from-violet-500 to-fuchsia-500" },
  { slug: "fashion", emoji: "👟", gradient: "from-sky-400 to-indigo-500" },
  { slug: "snack", emoji: "🍜", gradient: "from-amber-400 to-orange-500" },
  { slug: "wellness", emoji: "🌿", gradient: "from-emerald-400 to-teal-500" },
];

export type SkinType = "dry" | "oily" | "combination" | "sensitive";
export type Concern = "acne" | "brightening" | "aging" | "pores" | "hydration";

export interface Product {
  id: string;
  category: CategorySlug;
  brand: string;
  name: string;
  priceKrw: number;
  weightG: number;
  rating: number;
  reviews: number;
  rankChange: number; // + up, - down, compared to yesterday
  emoji: string;
  tags: string[];
  description: string;
  skinTypes?: SkinType[];
  concerns?: Concern[];
  limited?: boolean;
}

export const products: Product[] = [
  // K-Beauty
  { id: "b1", category: "beauty", brand: "Dewlab", name: "Snail Mucin 96 Essence", priceKrw: 21000, weightG: 180, rating: 4.8, reviews: 12840, rankChange: 0, emoji: "🐌", tags: ["Best", "Hydrating"], description: "Lightweight essence that repairs and deeply hydrates. A long-time global favorite.", skinTypes: ["dry", "combination", "sensitive"], concerns: ["hydration", "aging"] },
  { id: "b2", category: "beauty", brand: "Seoul Glow", name: "Rice Water Brightening Toner", priceKrw: 18000, weightG: 250, rating: 4.7, reviews: 8320, rankChange: 3, emoji: "🍚", tags: ["Trending"], description: "Fermented rice toner for a glassy, even tone.", skinTypes: ["dry", "oily", "combination"], concerns: ["brightening"] },
  { id: "b3", category: "beauty", brand: "Cica Garden", name: "Centella Calming Cream", priceKrw: 24000, weightG: 120, rating: 4.9, reviews: 15011, rankChange: 1, emoji: "🌱", tags: ["Best", "Sensitive"], description: "Soothes redness and strengthens the skin barrier.", skinTypes: ["sensitive", "combination"], concerns: ["acne", "hydration"] },
  { id: "b4", category: "beauty", brand: "Hanbang Lab", name: "Ginseng Firming Serum", priceKrw: 45000, weightG: 90, rating: 4.6, reviews: 4210, rankChange: -1, emoji: "🌰", tags: ["Premium"], description: "Traditional Korean herbal serum for elasticity.", skinTypes: ["dry", "combination"], concerns: ["aging"] },
  { id: "b5", category: "beauty", brand: "Pore Hero", name: "BHA Blackhead Pads (70ea)", priceKrw: 16000, weightG: 220, rating: 4.7, reviews: 9302, rankChange: 5, emoji: "🫧", tags: ["Trending"], description: "Gentle exfoliating pads to clear pores daily.", skinTypes: ["oily", "combination"], concerns: ["pores", "acne"] },
  { id: "b6", category: "beauty", brand: "Sun Daily", name: "Watery Sun Cream SPF50+", priceKrw: 15000, weightG: 70, rating: 4.8, reviews: 20113, rankChange: 0, emoji: "☀️", tags: ["Best"], description: "No white cast, no stickiness. The K-sunscreen everyone asks for.", skinTypes: ["dry", "oily", "combination", "sensitive"], concerns: ["aging", "brightening"] },
  { id: "b7", category: "beauty", brand: "Tint Studio", name: "Glass Lip Tint Set", priceKrw: 22000, weightG: 60, rating: 4.6, reviews: 6120, rankChange: 2, emoji: "💋", tags: ["Gift"], description: "Three juicy colors seen on every K-drama set." },
  { id: "b8", category: "beauty", brand: "Mask Day", name: "Sheet Mask 30-Day Pack", priceKrw: 30000, weightG: 750, rating: 4.5, reviews: 3880, rankChange: -2, emoji: "🎭", tags: ["Value"], description: "30 masks, 6 formulas. One for every night of your trip and beyond.", skinTypes: ["dry", "oily", "combination", "sensitive"], concerns: ["hydration", "brightening"] },

  // K-Pop
  { id: "k1", category: "kpop", brand: "Starlight Ent.", name: "Official Light Stick (Ver.3)", priceKrw: 55000, weightG: 400, rating: 4.9, reviews: 7210, rankChange: 0, emoji: "🔦", tags: ["Best", "Official"], description: "Bluetooth-synced light stick for concerts.", limited: true },
  { id: "k2", category: "kpop", brand: "Starlight Ent.", name: "New Mini Album (Random Ver.)", priceKrw: 19800, weightG: 350, rating: 4.8, reviews: 18320, rankChange: 4, emoji: "💿", tags: ["New", "Official"], description: "Includes photobook, random photocard and poster." },
  { id: "k3", category: "kpop", brand: "Idol Goods", name: "Photocard Binder & Sleeves", priceKrw: 14000, weightG: 300, rating: 4.7, reviews: 5320, rankChange: 1, emoji: "📒", tags: ["Collector"], description: "Protect and show off your card collection." },
  { id: "k4", category: "kpop", brand: "Seoul Fan Club", name: "Concert Fan Kit", priceKrw: 38000, weightG: 600, rating: 4.6, reviews: 2210, rankChange: 6, emoji: "🎫", tags: ["Limited"], description: "Slogan towel, badge, and lanyard set.", limited: true },
  { id: "k5", category: "kpop", brand: "Idol Goods", name: "Plush Character Keyring", priceKrw: 16000, weightG: 80, rating: 4.8, reviews: 9420, rankChange: -1, emoji: "🧸", tags: ["Gift"], description: "Soft keyring of the members' official characters." },

  // K-Fashion
  { id: "f1", category: "fashion", brand: "Seongsu Studio", name: "Oversized Logo Hoodie", priceKrw: 59000, weightG: 700, rating: 4.6, reviews: 3120, rankChange: 2, emoji: "🧥", tags: ["Trending"], description: "The Seongsu-dong look in one piece." },
  { id: "f2", category: "fashion", brand: "Hanok Wear", name: "Modern Hanbok Jacket", priceKrw: 89000, weightG: 500, rating: 4.8, reviews: 1210, rankChange: 7, emoji: "👘", tags: ["Unique"], description: "Traditional lines, everyday comfort." },
  { id: "f3", category: "fashion", brand: "Step Seoul", name: "Chunky Platform Sneakers", priceKrw: 79000, weightG: 1100, rating: 4.5, reviews: 2890, rankChange: 0, emoji: "👟", tags: ["Best"], description: "Height boost with all-day cushioning." },
  { id: "f4", category: "fashion", brand: "Seongsu Studio", name: "Bucket Hat", priceKrw: 29000, weightG: 120, rating: 4.4, reviews: 1950, rankChange: -3, emoji: "🧢", tags: [], description: "Lightweight hat, easy to pack." },

  // K-Snack
  { id: "s1", category: "snack", brand: "Fire Noodle Co.", name: "Spicy Fire Noodles (5 pack)", priceKrw: 6500, weightG: 700, rating: 4.7, reviews: 30120, rankChange: 0, emoji: "🔥", tags: ["Best"], description: "The viral spicy challenge noodles." },
  { id: "s2", category: "snack", brand: "Banana Milk Co.", name: "Banana Milk (6 pack)", priceKrw: 7200, weightG: 1400, rating: 4.9, reviews: 12100, rankChange: 1, emoji: "🍌", tags: ["Classic"], description: "Iconic Korean convenience-store drink. Best enjoyed at the hotel!" },
  { id: "s3", category: "snack", brand: "Seoul Sweets", name: "Honey Butter Chips Box", priceKrw: 12000, weightG: 600, rating: 4.6, reviews: 8800, rankChange: 2, emoji: "🍯", tags: ["Gift"], description: "Sweet and salty chips that started a craze." },
  { id: "s4", category: "snack", brand: "Kimchi House", name: "Vacuum-packed Kimchi (Travel)", priceKrw: 15000, weightG: 500, rating: 4.5, reviews: 2410, rankChange: 4, emoji: "🥬", tags: ["Travel-safe"], description: "Leak-proof pack approved for checked luggage." },

  // K-Wellness
  { id: "w1", category: "wellness", brand: "Red Ginseng Co.", name: "Red Ginseng Sticks (30ea)", priceKrw: 68000, weightG: 450, rating: 4.8, reviews: 6720, rankChange: 0, emoji: "🧧", tags: ["Best", "Gift"], description: "6-year-old Korean red ginseng for energy." },
  { id: "w2", category: "wellness", brand: "Jeju Tea", name: "Jeju Green Tea Gift Set", priceKrw: 32000, weightG: 400, rating: 4.7, reviews: 2210, rankChange: 3, emoji: "🍵", tags: ["Gift"], description: "Hand-picked green tea from Jeju island." },
  { id: "w3", category: "wellness", brand: "Spa Seoul", name: "Jjimjilbang Home Spa Kit", priceKrw: 27000, weightG: 550, rating: 4.4, reviews: 980, rankChange: 9, emoji: "🧖", tags: ["New"], description: "Italy towel, salt scrub and lamb-head towel - the bathhouse at home." },
];

export const getProduct = (id: string) => products.find((p) => p.id === id);
export const byCategory = (slug: string) =>
  products.filter((p) => p.category === slug).sort((a, b) => b.reviews * b.rating - a.reviews * a.rating);

// Partner hotels (mock). A real version would use a places/hotel API.
export interface Hotel {
  id: string;
  name: string;
  area: string;
  sameDayCutoff: string; // order before this time for same-day delivery
}

export const hotels: Hotel[] = [
  { id: "h1", name: "Lotte Hotel Seoul", area: "Myeongdong", sameDayCutoff: "15:00" },
  { id: "h2", name: "Four Seasons Hotel Seoul", area: "Gwanghwamun", sameDayCutoff: "15:00" },
  { id: "h3", name: "Signiel Seoul", area: "Jamsil", sameDayCutoff: "14:00" },
  { id: "h4", name: "L7 Hongdae", area: "Hongdae", sameDayCutoff: "16:00" },
  { id: "h5", name: "Grand Hyatt Seoul", area: "Itaewon", sameDayCutoff: "15:00" },
  { id: "h6", name: "Josun Palace", area: "Gangnam", sameDayCutoff: "15:00" },
  { id: "h7", name: "Ibis Styles Myeongdong", area: "Myeongdong", sameDayCutoff: "16:00" },
  { id: "h8", name: "Sofitel Ambassador", area: "Jamsil", sameDayCutoff: "14:00" },
];

export const deliverySlots = ["12:00-15:00", "15:00-18:00", "18:00-21:00", "21:00-23:00"];

export type Currency = "KRW" | "USD" | "JPY" | "CNY" | "EUR";
// Static demo rates (KRW per 1 unit). Replace with a live FX API.
export const fxRates: Record<Currency, number> = { KRW: 1, USD: 1380, JPY: 9.1, CNY: 190, EUR: 1490 };

export function formatPrice(krw: number, currency: Currency) {
  const value = krw / fxRates[currency];
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" || currency === "JPY" ? 0 : 2,
  }).format(value);
}

// Simplified immediate tax refund estimate for foreign tourists.
// Real refund depends on the store's refund operator and current law.
export function estimateTaxRefund(totalKrw: number) {
  if (totalKrw < 15000) return 0;
  return Math.round(totalKrw * 0.07);
}

export const LUGGAGE_ALLOWANCE_G = 5000; // suggested "extra shopping" budget per traveler
