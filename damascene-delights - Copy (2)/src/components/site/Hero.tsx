import hero from "@/assets/hero.jpg";
import { useI18n } from "@/lib/i18n";
import { ArrowDown } from "lucide-react";

export function Hero() {
  const { t, lang } = useI18n();
  return (
    <section id="top" className="relative isolate overflow-hidden">
      <img
        src={hero}
        alt=""
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, oklch(0.75 0.13 82 / 0.5) 0, transparent 40%), radial-gradient(circle at 80% 70%, oklch(0.42 0.14 20 / 0.5) 0, transparent 40%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 md:py-40 lg:py-48 text-center text-[color:var(--cream)]">
        <div className="ornament-divider mx-auto max-w-md mb-6 opacity-80">
          <span className="text-[color:var(--gold)] text-xs tracking-[0.5em] uppercase">
            {t("hero.eyebrow")}
          </span>
        </div>

        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-medium tracking-tight leading-[0.95]">
          {lang === "ar" ? (
            <span style={{ fontFamily: "var(--font-arabic-display)" }}>الخال الدمشقي</span>
          ) : (
            <>
              <span className="block">ALKHAL</span>
              <span className="block text-gold-gradient italic">ALDIMASHKI</span>
            </>
          )}
        </h1>

        <p className="mt-6 max-w-xl mx-auto text-base sm:text-lg text-[color:var(--cream)]/85 leading-relaxed">
          {t("hero.sub")}
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a
            href="#menu"
            className="group inline-flex items-center gap-2 rounded-full bg-[color:var(--gold)] px-7 py-3.5 text-sm font-semibold text-[color:var(--charcoal)] shadow-[0_10px_40px_-10px_oklch(0.75_0.13_82/0.6)] hover:bg-[color:var(--cream)] transition-all"
          >
            {t("hero.cta")}
            <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
          </a>
          <a
            href="#visit"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--cream)]/40 px-7 py-3.5 text-sm font-medium text-[color:var(--cream)] hover:bg-[color:var(--cream)]/10 transition-colors"
          >
            {t("nav.visit")}
          </a>
        </div>
      </div>
    </section>
  );
}
