"use client";
// Client state: language, currency and cart, remembered in the browser.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { detectLocale, messages, type Messages } from "./i18n";
import type { Currency } from "./config";
import { repo } from "./repo";
import type { Locale, Product } from "./types";

export interface CartLine { productId: string; qty: number }

interface Store {
  locale: Locale; setLocale: (l: Locale) => void; m: Messages;
  currency: Currency; setCurrency: (c: Currency) => void;
  cart: CartLine[]; add: (id: string, qty?: number) => void; setQty: (id: string, qty: number) => void; clear: () => void;
  cartItems: { product: Product; qty: number }[];
  ready: boolean;
}

const Ctx = createContext<Store | null>(null);
const defaultCurrency: Record<Locale, Currency> = { en: "USD", ja: "JPY", "zh-CN": "CNY", "zh-TW": "TWD", ko: "KRW" };

function read<T>(k: string): T | undefined {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : undefined; } catch { return undefined; }
}
function write(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } }

export function StoreProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [known, setKnown] = useState<Record<string, Product | null>>({});

  useEffect(() => {
    const l = read<Locale>("hs.locale") ?? detectLocale(navigator.language);
    setLocaleState(l);
    setCurrency(read<Currency>("hs.currency") ?? defaultCurrency[l]);
    setCart(read<CartLine[]>("hs.cart") ?? []);
    setReady(true);
  }, []);
  useEffect(() => { if (ready) write("hs.locale", locale); document.documentElement.lang = locale; }, [locale, ready]);
  useEffect(() => { if (ready) write("hs.currency", currency); }, [currency, ready]);
  useEffect(() => { if (ready) write("hs.cart", cart); }, [cart, ready]);
  // Load product details for cart lines we have not seen yet.
  useEffect(() => {
    const missing = cart.map((x) => x.productId).filter((id) => !(id in known));
    if (!missing.length) return;
    Promise.all(missing.map((id) => repo.getProduct(id).catch(() => undefined)))
      .then((ps) => setKnown((k) => ({ ...k, ...Object.fromEntries(missing.map((id, i) => [id, ps[i] ?? null])) })));
  }, [cart, known]);

  const value = useMemo<Store>(() => ({
    locale, m: messages(locale),
    setLocale: (l) => { setLocaleState(l); setCurrency(defaultCurrency[l]); },
    currency, setCurrency, cart, ready,
    add: (id, qty = 1) => setCart((c) => c.some((x) => x.productId === id) ? c.map((x) => x.productId === id ? { ...x, qty: x.qty + qty } : x) : [...c, { productId: id, qty }]),
    setQty: (id, qty) => setCart((c) => qty <= 0 ? c.filter((x) => x.productId !== id) : c.map((x) => x.productId === id ? { ...x, qty } : x)),
    clear: () => setCart([]),
    cartItems: cart.flatMap((x) => { const product = known[x.productId]; return product ? [{ product, qty: x.qty }] : []; }),
  }), [locale, currency, cart, ready, known]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}
