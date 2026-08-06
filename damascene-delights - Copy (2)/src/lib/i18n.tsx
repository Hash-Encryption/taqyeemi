import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

type Dict = Record<string, { en: string; ar: string }>;

const dict: Dict = {
  "nav.menu": { en: "Menu", ar: "القائمة" },
  "nav.about": { en: "Our Story", ar: "قصتنا" },
  "nav.visit": { en: "Visit", ar: "زورونا" },
  "hero.eyebrow": { en: "A Taste of Damascus", ar: "نكهة من دمشق" },
  "hero.title": { en: "ALKHAL ALDIMASHKI", ar: "الخال الدمشقي" },
  "hero.sub": { en: "Heritage recipes, hand-plated. From the old city of Damascus to your table.", ar: "وصفات عريقة، محضّرة بحبّ. من دمشق القديمة إلى مائدتكم." },
  "hero.cta": { en: "View Menu", ar: "عرض القائمة" },
  "hero.call": { en: "Order via WhatsApp", ar: "اطلب عبر واتساب" },
  "menu.title": { en: "The Menu", ar: "قائمة الطعام" },
  "menu.sub": { en: "A curated journey through Syria's most beloved dishes.", ar: "رحلة مختارة عبر أشهر أطباق سوريا." },
  "menu.add": { en: "Add", ar: "أضف" },
  "menu.added": { en: "Added", ar: "أُضيف" },
  "cart.title": { en: "Your Order", ar: "طلبك" },
  "cart.empty": { en: "Your cart is empty. Add a dish to get started.", ar: "السلة فارغة. أضف طبقًا للبدء." },
  "cart.total": { en: "Total", ar: "المجموع" },
  "cart.checkout": { en: "Order via WhatsApp", ar: "اطلب عبر واتساب" },
  "cart.qty": { en: "Qty", ar: "الكمية" },
  "cart.clear": { en: "Clear", ar: "إفراغ" },
  "cart.msg.hello": { en: "Hello ALKHAL ALDIMASHKI, I would like to order:", ar: "مرحبًا الخال الدمشقي، أود أن أطلب:" },
  "cart.msg.total": { en: "Total", ar: "المجموع" },
  "footer.hours": { en: "Hours", ar: "أوقات العمل" },
  "footer.hours.val": { en: "Daily · 12:00 — 23:30", ar: "يوميًا · 12:00 — 23:30" },
  "footer.visit": { en: "Visit", ar: "العنوان" },
  "footer.visit.val": { en: "Old Damascus Quarter", ar: "حي دمشق القديمة" },
  "footer.contact": { en: "Contact", ar: "تواصل معنا" },
  "footer.rights": { en: "All rights reserved.", ar: "جميع الحقوق محفوظة." },
  "footer.tag": { en: "Crafted with heritage in every bite.", ar: "صُنع بشغف الأصالة في كل قضمة." },
};

type Ctx = {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (l: Lang) => void;
  t: (k: keyof typeof dict) => string;
  tf: (o: any, key: "name" | "description" | "category") => string;
};

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && (localStorage.getItem("lang") as Lang)) || null;
    if (saved === "ar" || saved === "en") setLang(saved);
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", dir);
    try { localStorage.setItem("lang", lang); } catch {}
  }, [lang]);

  const t = (k: keyof typeof dict) => dict[k][lang];
  const tf = (o: any, key: "name" | "description" | "category") => {
    const suffix = lang === "ar" ? "_ar" : "_en";
    return o[`${key}${suffix}`];
  };

  return (
    <I18nCtx.Provider value={{ lang, dir: lang === "ar" ? "rtl" : "ltr", setLang, t, tf }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
