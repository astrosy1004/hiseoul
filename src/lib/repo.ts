// Data access layer. Pages call only these functions, so step 2 can swap
// the in-memory sample data for Supabase without touching the UI.
import { hotels, products, rankings, sampleOrders, staff } from "./mock-data";
import type { CategorySlug, Hotel, Order, Product, Region, Staff } from "./types";

export const repo = {
  listProducts: (opts?: { category?: CategorySlug; includeHidden?: boolean }): Product[] =>
    products.filter((x) => (opts?.includeHidden || x.visible) && (!opts?.category || x.category === opts.category)),
  getProduct: (id: string): Product | undefined => products.find((x) => x.id === id),
  ranking: (region: Region, category?: CategorySlug, limit = 10) =>
    rankings
      .filter((r) => r.region === region)
      .sort((a, b) => a.rank - b.rank)
      .map((r) => ({ ...r, product: products.find((x) => x.id === r.productId)! }))
      .filter((r) => r.product.visible && (!category || r.product.category === category))
      .slice(0, limit),
  listHotels: (): Hotel[] => hotels,
  getHotel: (id: string) => hotels.find((h) => h.id === id),
  listOrders: (): Order[] => sampleOrders,
  listStaff: (): Staff[] => staff,
};
