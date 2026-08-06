import { Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function About() {
  const { t } = useI18n();

  return (
    <section id="about" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-[color:var(--gold-deep)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t("about.eyebrow")}
          </div>
          <h2 className="mt-4 max-w-xl font-display text-4xl leading-tight text-[color:var(--charcoal)] sm:text-5xl md:text-6xl">
            {t("about.title")}
          </h2>
        </div>

        <div className="relative border-s border-[color:var(--gold)]/60 ps-6 sm:ps-10">
          <span className="absolute -start-1.5 top-1 h-3 w-3 rotate-45 bg-[color:var(--gold)]" aria-hidden="true" />
          <p className="text-base leading-8 text-[color:var(--charcoal)]/80 sm:text-lg">
            {t("about.body")}
          </p>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--rose)]">
            {t("about.signature")}
          </p>
        </div>
      </div>
    </section>
  );
}
