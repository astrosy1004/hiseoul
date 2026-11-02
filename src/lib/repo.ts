// Data access layer. Pages call only these functions.
// With Supabase configured (.env.local) data comes from the database;
// otherwise from the sample data, so the app always runs.
import { hotels, products, rankings, sampleOrders, staff } from "./mock-data";
import { DELIVERY_FEE_KRW, MAX_QTY_PER_ITEM, MIN_LEAD_HOURS, SAME_DAY_CUTOFF_HOUR, SERVICE_FEE_KRW } from "./config";
import { deliveryDays, type Settings } from "./delivery";
import { supabase } from "./supabase";
import type { CategorySlug, DeliverySlot, Hotel, Order, OrderStatus, PaymentMethod, Product, RankingEntry, Region, Staff } from "./types";

export interface NewOrder {
  email: string; guestName: string; hotelId: string; room?: string;
  deliveryDate: string; slot: DeliverySlot; paymentMethod: PaymentMethod;
  lines: { productId: string; qty: number }[];
}
/** Error codes from create_order(); the checkout shows a message for each. */
export class OrderError extends Error {}
const ORDER_ERRORS = ["invalid_lines", "invalid_name", "invalid_email", "invalid_room", "invalid_hotel", "invalid_slot", "invalid_payment_method", "invalid_date", "slot_closed", "invalid_qty", "unavailable_item", "not_pending", "test_payments_off"];

export type Ranked = RankingEntry & { product: Product };

/* eslint-disable @typescript-eslint/no-explicit-any */
const toProduct = (r: any): Product => ({
  id: r.id, category: r.category, brand: r.brand, name: r.name, description: r.description,
  storePriceKrw: r.store_price_krw, imageUrl: r.image_url ?? undefined, rating: Number(r.rating), reviewCount: r.review_count,
  skinTypes: r.skin_types ?? undefined, concerns: r.concerns ?? undefined, routineStep: r.routine_step ?? undefined,
  visible: r.visible, stock: r.stock,
});
const toHotel = (r: any): Hotel => ({ id: r.id, name: r.name, area: r.area });
const toOrder = (r: any): Order => ({
  id: r.id, createdAt: r.created_at, email: r.email, guestName: r.guest_name, hotelId: r.hotel_id, room: r.room ?? undefined,
  deliveryDate: r.delivery_date, slot: r.slot,
  lines: (r.lines ?? r.order_lines ?? []).map((l: any) => ({ productId: l.product_id, qty: l.qty, unitPriceKrw: l.unit_price_krw })),
  itemsKrw: r.items_krw, serviceFeeKrw: r.service_fee_krw, deliveryFeeKrw: r.delivery_fee_krw, totalKrw: r.total_krw,
  paymentMethod: r.payment_method, status: r.status, handoverPhotoUrl: r.handover_photo_url ?? undefined,
});
const toStaff = (r: any): Staff => ({
  id: r.id, name: r.name, email: r.email, role: r.role, active: r.active,
  mfaEnabled: !!r.mfa_enabled, lastLoginAt: r.last_login_at ?? undefined,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

const DEFAULT_SETTINGS: Settings = { serviceFeeKrw: SERVICE_FEE_KRW, deliveryFeeKrw: DELIVERY_FEE_KRW, cutoffHour: SAME_DAY_CUTOFF_HOUR, minLeadHours: MIN_LEAD_HOURS, testPayments: true };
const orderError = (message: string) => new OrderError(ORDER_ERRORS.find((c) => message.includes(c)) ?? "failed");

// In-memory copies so admin changes stick for the session in sample mode.
let mockOrders = sampleOrders.map((o) => ({ ...o }));
let mockProducts = products.map((p) => ({ ...p }));
let mockStaff = staff.map((s) => ({ ...s }));

export const repo = {
  async listProducts(opts?: { category?: CategorySlug; includeHidden?: boolean }): Promise<Product[]> {
    if (!supabase) return mockProducts.filter((x) => (opts?.includeHidden || x.visible) && (!opts?.category || x.category === opts.category));
    let q = supabase.from("products").select("*").order("id");
    if (opts?.category) q = q.eq("category", opts.category);
    if (!opts?.includeHidden) q = q.eq("visible", true);
    return must(await q).map(toProduct);
  },

  async getProduct(id: string): Promise<Product | undefined> {
    if (!supabase) return mockProducts.find((x) => x.id === id);
    const row = must(await supabase.from("products").select("*").eq("id", id).maybeSingle());
    return row ? toProduct(row) : undefined;
  },

  async ranking(region: Region, category?: CategorySlug, limit = 10): Promise<Ranked[]> {
    if (!supabase)
      return rankings
        .filter((r) => r.region === region)
        .sort((a, b) => a.rank - b.rank)
        .map((r) => ({ ...r, product: mockProducts.find((x) => x.id === r.productId)! }))
        .filter((r) => r.product.visible && (!category || r.product.category === category))
        .slice(0, limit);
    // Inner join keeps only products this visitor may see (hidden ones drop out).
    let q = supabase.from("rankings").select("region, rank, change, is_new, product_id, products!inner(*)").eq("region", region).eq("products.visible", true).order("rank");
    if (category) q = q.eq("products.category", category);
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const rows = must(await q.limit(limit)) as any[];
    return rows.map((r) => ({ productId: r.product_id, region: r.region, rank: r.rank, change: r.is_new ? "new" : r.change, product: toProduct(r.products) }));
  },

  /** Search visible products by brand or name in any language. */
  async search(query: string): Promise<Product[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const all = await repo.listProducts();
    const text = (p: Product) => [...Object.values(p.brand), ...Object.values(p.name)].join(" ").toLowerCase();
    return all.filter((p) => q.split(/\s+/).every((w) => text(p).includes(w)));
  },

  /** Other popular items in the same category, for "travelers also bought". */
  async related(product: Product, region: Region, limit = 6): Promise<Product[]> {
    const ranked = (await repo.ranking(region, product.category, 20)).map((r) => r.product);
    const rest = (await repo.listProducts({ category: product.category })).filter((p) => !ranked.some((r) => r.id === p.id));
    return [...ranked, ...rest].filter((p) => p.id !== product.id).slice(0, limit);
  },

  async listHotels(): Promise<Hotel[]> {
    if (!supabase) return hotels;
    return must(await supabase.from("hotels").select("*").order("id")).map(toHotel);
  },

  async getHotel(id: string): Promise<Hotel | undefined> {
    return (await repo.listHotels()).find((h) => h.id === id);
  },

  /** Guest lookup with order number + email. */
  async lookupOrder(id: string, email: string): Promise<Order | undefined> {
    if (!supabase) return mockOrders.find((x) => x.id.toLowerCase() === id.trim().toLowerCase() && x.email.toLowerCase() === email.trim().toLowerCase());
    const row = must(await supabase.rpc("lookup_order", { p_id: id, p_email: email }));
    return row ? toOrder(row) : undefined;
  },

  async getSettings(): Promise<Settings> {
    if (!supabase) return DEFAULT_SETTINGS;
    const r = must(await supabase.from("app_settings").select("*").eq("id", 1).maybeSingle()) as Record<string, number & boolean> | null;
    return r ? { serviceFeeKrw: r.service_fee_krw, deliveryFeeKrw: r.delivery_fee_krw, cutoffHour: r.cutoff_hour, minLeadHours: r.min_lead_hours, testPayments: r.test_payments } : DEFAULT_SETTINGS;
  },

  /** Guest checkout. Returns the new order (status "pending" until paid). Throws OrderError. */
  async createOrder(o: NewOrder): Promise<Order> {
    if (supabase) {
      const res = await supabase.rpc("create_order", { p: {
        email: o.email, guest_name: o.guestName, hotel_id: o.hotelId, room: o.room ?? "", delivery_date: o.deliveryDate,
        slot: o.slot, payment_method: o.paymentMethod, lines: o.lines.map((l) => ({ product_id: l.productId, qty: l.qty })),
      } });
      if (res.error) throw orderError(res.error.message);
      const order = await repo.lookupOrder(res.data as string, o.email);
      if (!order) throw new OrderError("failed");
      return order;
    }
    // Sample mode: same checks as the database function.
    const s = DEFAULT_SETTINGS;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email.trim())) throw new OrderError("invalid_email");
    if (!o.guestName.trim()) throw new OrderError("invalid_name");
    if (!hotels.some((h) => h.id === o.hotelId)) throw new OrderError("invalid_hotel");
    const day = deliveryDays(s).find((d) => d.date === o.deliveryDate);
    if (!day?.slots.some((x) => x.slot === o.slot && x.open)) throw new OrderError("slot_closed");
    const merged = new Map<string, number>();
    o.lines.forEach((l) => merged.set(l.productId, (merged.get(l.productId) ?? 0) + l.qty));
    if (!merged.size) throw new OrderError("invalid_lines");
    const lines = [...merged].map(([productId, qty]) => {
      const p = mockProducts.find((x) => x.id === productId);
      if (!p || !p.visible || p.stock === "sold_out") throw new OrderError("unavailable_item");
      if (qty < 1 || qty > MAX_QTY_PER_ITEM) throw new OrderError("invalid_qty");
      return { productId, qty, unitPriceKrw: p.storePriceKrw };
    });
    const itemsKrw = lines.reduce((n, l) => n + l.qty * l.unitPriceKrw, 0);
    const order: Order = {
      id: `HS-${1043 + mockOrders.length - sampleOrders.length}`, createdAt: new Date().toISOString(), email: o.email.trim().toLowerCase(),
      guestName: o.guestName.trim(), hotelId: o.hotelId, room: o.room?.trim() || undefined, deliveryDate: o.deliveryDate, slot: o.slot, lines,
      itemsKrw, serviceFeeKrw: s.serviceFeeKrw, deliveryFeeKrw: s.deliveryFeeKrw, totalKrw: itemsKrw + s.serviceFeeKrw + s.deliveryFeeKrw,
      paymentMethod: o.paymentMethod, status: "pending",
    };
    mockOrders = [order, ...mockOrders];
    return order;
  },

  /** Test payments only (see payments.ts). Throws OrderError. */
  async confirmTestPayment(id: string, email: string): Promise<void> {
    if (supabase) {
      const res = await supabase.rpc("confirm_test_payment", { p_id: id, p_email: email });
      if (res.error) throw orderError(res.error.message);
      return;
    }
    const o = mockOrders.find((x) => x.id === id && x.email === email.trim().toLowerCase() && x.status === "pending");
    if (!o) throw new OrderError("not_pending");
    mockOrders = mockOrders.map((x) => (x.id === id ? { ...x, status: "paid" } : x));
  },

  /** Staff only (blocked by database rules for everyone else). */
  async listOrders(): Promise<Order[]> {
    if (!supabase) return mockOrders;
    return must(await supabase.from("orders").select("*, order_lines(*)").order("created_at", { ascending: false })).map(toOrder);
  },

  async setOrderStatus(id: string, status: OrderStatus): Promise<void> {
    if (!supabase) { mockOrders = mockOrders.map((o) => (o.id === id ? { ...o, status } : o)); return; }
    must(await supabase.from("orders").update({ status }).eq("id", id).select("id").single());
  },

  async setProductVisible(id: string, visible: boolean): Promise<void> {
    if (!supabase) { mockProducts = mockProducts.map((p) => (p.id === id ? { ...p, visible } : p)); return; }
    must(await supabase.from("products").update({ visible }).eq("id", id).select("id").single());
  },

  /** Owner only. */
  async listStaff(): Promise<Staff[]> {
    if (!supabase) return mockStaff;
    return must(await supabase.rpc("staff_list")).map(toStaff);
  },

  async setStaffActive(id: string, active: boolean): Promise<void> {
    if (!supabase) { mockStaff = mockStaff.map((s) => (s.id === id ? { ...s, active } : s)); return; }
    must(await supabase.from("staff").update({ active }).eq("id", id).select("id").single());
  },
};

/** The tracking page needs the email again; keep it for this browser tab only. */
export function rememberLookup(id: string, email: string) {
  try { sessionStorage.setItem(`hs.lookup.${id.toUpperCase()}`, email); } catch { /* ignore */ }
}
export function recallLookup(id: string): string | undefined {
  try { return sessionStorage.getItem(`hs.lookup.${id.toUpperCase()}`) ?? undefined; } catch { return undefined; }
}
