import { useState } from "react";
import { ShoppingBag, Languages, Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";

export function Header() {
  const { lang, setLang, t } = useI18n();
  const { count, setOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "#menu", label: t("nav.menu") },
    { href: "#about", label: t("nav.about") },
    { href: "#visit", label: t("nav.visit") },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[color:var(--cream)]/85 border-b border-[color:var(--border)]/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-3 min-w-0">
            <img src={logo} alt="" width={40} height={40} className="h-9 w-9 sm:h-11 sm:w-11 shrink-0" />
            <div className="min-w-0 leading-tight">
              <div className="font-display text-[15px] sm:text-lg font-semibold tracking-wide text-[color:var(--charcoal)] truncate">
                ALKHAL ALDIMASHKI
              </div>
              <div className="text-[11px] sm:text-xs text-[color:var(--gold-deep)] tracking-[0.2em] uppercase" style={{ fontFamily: "var(--font-arabic-display)" }}>
                الخال الدمشقي
              </div>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-[color:var(--charcoal)]/80">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-[color:var(--rose)] transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="group inline-flex items-center gap-1.5 rounded-full border border-[color:var(--gold-deep)]/40 px-3 py-1.5 text-xs font-medium text-[color:var(--charcoal)] hover:bg-[color:var(--gold)]/10 transition-colors"
              aria-label="Toggle language"
            >
              <Languages className="h-3.5 w-3.5" />
              <span className={lang === "en" ? "text-[color:var(--rose)] font-bold" : ""}>EN</span>
              <span className="opacity-40">/</span>
              <span className={lang === "ar" ? "text-[color:var(--rose)] font-bold" : ""} style={{ fontFamily: "var(--font-arabic)" }}>ع</span>
            </button>

            <button
              onClick={() => setOpen(true)}
              className="relative inline-flex items-center justify-center h-10 w-10 rounded-full bg-[color:var(--charcoal)] text-[color:var(--cream)] hover:bg-[color:var(--rose)] transition-colors"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 rtl:-left-1 rtl:right-auto h-5 min-w-5 px-1 rounded-full bg-[color:var(--gold)] text-[color:var(--charcoal)] text-[11px] font-bold flex items-center justify-center shadow-md">
                  {count}
                </span>
              )}
            </button>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-full border border-[color:var(--border)] text-[color:var(--charcoal)] hover:bg-[color:var(--gold)]/10 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-[color:var(--charcoal)]/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile menu drawer */}
      <div
        className={`fixed top-16 inset-x-0 z-35 md:hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-3 pointer-events-none"
        }`}
      >
        <nav className="mx-4 mt-2 rounded-2xl bg-[color:var(--cream)] border border-[color:var(--border)]/60 shadow-[var(--shadow-elegant)] overflow-hidden">
          {navLinks.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center px-6 py-4 text-base font-medium text-[color:var(--charcoal)] hover:bg-[color:var(--gold)]/10 hover:text-[color:var(--rose)] transition-colors ${
                i < navLinks.length - 1 ? "border-b border-[color:var(--border)]/50" : ""
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </>
  );
}
