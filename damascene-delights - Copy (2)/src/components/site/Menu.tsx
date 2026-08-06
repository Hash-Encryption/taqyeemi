import { useState } from "react";
import { Plus } from "lucide-react";
import { menu } from "@/lib/menu-data";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";

export function Menu() {
  const { t, tf, lang } = useI18n();
  const { add } = useCart();
  const [active, setActive] = useState(menu[0].id);
  const [flash, setFlash] = useState<string | null>(null);

  const handleAdd = (item: any) => {
    add(item);
    setFlash(item.id);
    setTimeout(() => setFlash((c) => (c === item.id ? null : c)), 900);
  };

  return (
    <section id="menu" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="ornament-divider mb-4">
            <span className="text-[color:var(--gold-deep)] text-[11px] tracking-[0.4em] uppercase">
              {lang === "ar" ? "قائمتنا" : "Our Menu"}
            </span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-[color:var(--charcoal)]">
            {t("menu.title")}
          </h2>
          <p className="mt-3 text-[color:var(--muted-foreground)]">{t("menu.sub")}</p>
        </div>

        {/* Sticky category nav */}
        <div className="sticky top-16 sm:top-20 z-30 -mx-4 sm:mx-0 mb-10 backdrop-blur-md bg-[color:var(--cream)]/85 border-y border-[color:var(--border)]/60">
          <div className="flex gap-2 overflow-x-auto px-4 sm:px-2 py-3 no-scrollbar">
            {menu.map((c) => (
              <a
                key={c.id}
                href={`#cat-${c.id}`}
                onClick={() => setActive(c.id)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  active === c.id
                    ? "bg-[color:var(--charcoal)] text-[color:var(--cream)] border-[color:var(--charcoal)]"
                    : "border-[color:var(--border)] text-[color:var(--charcoal)]/80 hover:border-[color:var(--gold-deep)]"
                }`}
              >
                {tf(c, "category")}
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-20">
          {menu.map((cat) => (
            <div key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-36">
              {/* Category banner */}
              <div className="relative overflow-hidden rounded-2xl h-56 sm:h-72 md:h-80 mb-8 shadow-[var(--shadow-elegant)]">
                <img
                  src={cat.image}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--charcoal)]/85 via-[color:var(--charcoal)]/30 to-transparent" />
                <div className="absolute inset-0 flex items-end p-6 sm:p-10">
                  <div>
                    <div className="text-[color:var(--gold)] text-[11px] tracking-[0.4em] uppercase mb-2">
                      {lang === "ar" ? "فئة" : "Category"}
                    </div>
                    <h3 className="font-display text-3xl sm:text-4xl md:text-5xl text-[color:var(--cream)]">
                      {tf(cat, "category")}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Items */}
              <ul className="grid gap-4 sm:gap-5 md:grid-cols-2">
                {cat.items.map((item) => (
                  <li
                    key={item.id}
                    className="group relative bg-[color:var(--card)] border border-[color:var(--border)]/70 rounded-xl p-5 sm:p-6 hover:border-[color:var(--gold-deep)]/60 hover:shadow-[var(--shadow-card)] transition-all"
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <h4 className="font-display text-xl sm:text-2xl text-[color:var(--charcoal)] leading-tight">
                            {tf(item, "name")}
                          </h4>
                          <span
                            className="text-[color:var(--muted-foreground)] text-sm"
                            style={{ fontFamily: lang === "en" ? "var(--font-arabic)" : "var(--font-display)" }}
                          >
                            {lang === "en" ? item.name_ar : item.name_en}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-[color:var(--muted-foreground)] leading-relaxed line-clamp-3">
                          {tf(item, "description")}
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <span className="text-[color:var(--rose)] font-semibold text-lg">
                            ${item.price}
                          </span>
                          <span className="h-px flex-1 bg-gradient-to-r from-[color:var(--gold)]/50 to-transparent rtl:from-transparent rtl:to-[color:var(--gold)]/50" />
                        </div>
                      </div>

                      <button
                        onClick={() => handleAdd(item)}
                        className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                          flash === item.id
                            ? "bg-[color:var(--olive)] text-[color:var(--cream)]"
                            : "bg-[color:var(--charcoal)] text-[color:var(--cream)] hover:bg-[color:var(--rose)]"
                        }`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {flash === item.id ? t("menu.added") : t("menu.add")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
