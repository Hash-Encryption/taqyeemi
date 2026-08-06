import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { MenuItem } from "./menu-data";

export type CartLine = { item: MenuItem; qty: number };

type Ctx = {
  lines: CartLine[];
  count: number;
  total: number;
  add: (item: MenuItem) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (b: boolean) => void;
};

const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);

  const add = (item: MenuItem) =>
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.item.id === item.id);
      if (idx === -1) return [...prev, { item, qty: 1 }];
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
      return next;
    });
  const inc = (id: string) => setLines((p) => p.map((l) => (l.item.id === id ? { ...l, qty: l.qty + 1 } : l)));
  const dec = (id: string) =>
    setLines((p) => p.flatMap((l) => (l.item.id === id ? (l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []) : [l])));
  const remove = (id: string) => setLines((p) => p.filter((l) => l.item.id !== id));
  const clear = () => setLines([]);

  const { count, total } = useMemo(() => {
    let c = 0, t = 0;
    for (const l of lines) { c += l.qty; t += l.qty * l.item.price; }
    return { count: c, total: t };
  }, [lines]);

  return (
    <CartCtx.Provider value={{ lines, count, total, add, inc, dec, remove, clear, open, setOpen }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}

// WhatsApp phone number for orders — change to real number
export const WHATSAPP_NUMBER = "966551117889";
