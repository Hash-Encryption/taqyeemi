import { MapPin, Navigation } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const MAP_QUERY = "ALKHAL ALDIMASHKI, Prince Saud Al Faisal Street, Ar Rawdah, Jeddah";
const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`;
const MAP_DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`;

export function Location() {
  const { t } = useI18n();

  return (
    <section id="visit" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-elegant)]">
          <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-[color:var(--gold-deep)]">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {t("location.eyebrow")}
              </div>
              <h2 className="mt-4 font-display text-4xl leading-tight text-[color:var(--charcoal)] sm:text-5xl">
                {t("location.title")}
              </h2>
              <p className="mt-4 max-w-md leading-7 text-[color:var(--muted-foreground)]">
                {t("location.body")}
              </p>
              <address className="mt-6 not-italic text-sm font-medium leading-6 text-[color:var(--charcoal)]">
                {t("location.address")}
              </address>
              <a
                href={MAP_DIRECTIONS_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-[color:var(--charcoal)] px-5 py-3 text-sm font-semibold text-[color:var(--cream)] transition-colors hover:bg-[color:var(--rose)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--gold-deep)]"
              >
                <Navigation className="h-4 w-4" aria-hidden="true" />
                {t("location.directions")}
              </a>
            </div>

            <div className="min-h-[360px] border-t border-[color:var(--border)] lg:min-h-[480px] lg:border-s lg:border-t-0">
              <iframe
                src={MAP_EMBED_URL}
                title={t("location.mapTitle")}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="h-full min-h-[360px] w-full lg:min-h-[480px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
