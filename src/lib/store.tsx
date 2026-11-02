"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dictionaries, type Dict, type Lang } from "./i18n";
import { getProduct, type Currency, type Product } from "./data";

export interface CartLine { id: string; qty: number }
export interface Order {
  id: string;
  createdAt: number;
  lines: CartLine[];
  totalKrw: number;
  refundKrw: number;
  hotel: string;
  room?: string;
  guestName: string;
  deliveryDate: string;
  slot: string;
  shipHome: boolean;
}

interface Store {
  lang: Lang; setLang: (l: Lang) => void; t: Dict;
  currency: Currency; setCurrency: (c: Currency) => void;
  cart: CartLine[];
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  cartItems: { product: Product; qty: number }[];
  orders: Order[];
  addOrder: (o: Order) => void;
}

const Ctx = createContext<Store | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLang(load("hs.lang", "en"));
    setCurrency(load("hs.currency", "USD"));
    setCart(load("hs.cart", []));
    setOrders(load("hs.orders", []));
    setReady(true);
  }, []);
  useEffect(() => { if (ready) save("hs.lang", lang); }, [lang, ready]);
  useEffect(() => { if (ready) save("hs.currency", currency); }, [currency, ready]);
  useEffect(() => { if (ready) save("hs.cart", cart); }, [cart, ready]);
  useEffect(() => { if (ready) save("hs.orders", orders); }, [orders, ready]);

  const value = useMemo<Store>(() => ({
    lang, setLang, t: dictionaries[lang],
    currency, setCurrency,
    cart,
    add: (id, qty = 1) => setCart((c) => {
      const found = c.find((l) => l.id === id);
      return found ? c.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l)) : [...c, { id, qty }];
    }),
    setQty: (id, qty) => setCart((c) => (qty <= 0 ? c.filter((l) => l.id !== id) : c.map((l) => (l.id === id ? { ...l, qty } : l)))),
    clear: () => setCart([]),
    cartItems: cart.flatMap((l) => {
      const product = getProduct(l.id);
      return product ? [{ product, qty: l.qty }] : [];
    }),
    orders,
    addOrder: (o) => setOrders((os) => [o, ...os]),
  }), [lang, currency, cart, orders]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}
