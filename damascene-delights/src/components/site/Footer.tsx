import { useI18n } from "@/lib/i18n";
import { Instagram, Facebook, Phone, MapPin, Clock } from "lucide-react";
import logo from "@/assets/logo.png";

export function Footer() {
  const { t, lang } = useI18n();
  return (
    <footer className="relative bg-[color:var(--charcoal)] text-[color:var(--cream)] mt-20">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" width={48} height={48} className="h-12 w-12" />
            <div>
              <div className="font-display text-lg">ALKHAL ALDIMASHKI</div>
              <div className="text-xs text-[color:var(--gold)]" style={{ fontFamily: "var(--font-arabic-display)" }}>الخال الدمشقي</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-[color:var(--cream)]/70 leading-relaxed">{t("footer.tag")}</p>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--gold)] mb-3 inline-flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" /> {t("footer.hours")}
          </div>
          <p className="text-sm text-[color:var(--cream)]/80">{t("footer.hours.val")}</p>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--gold)] mb-3 inline-flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" /> {t("footer.visit")}
          </div>
          <p className="text-sm text-[color:var(--cream)]/80">{t("footer.visit.val")}</p>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--gold)] mb-3 inline-flex items-center gap-2">
            <Phone className="h-3.5 w-3.5" /> {t("footer.contact")}
          </div>
          <p className="text-sm text-[color:var(--cream)]/80" dir="ltr">+1 (234) 567-890</p>
          <div className="mt-4 flex gap-3">
            <a href="#" aria-label="Instagram" className="h-9 w-9 rounded-full border border-[color:var(--cream)]/20 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] flex items-center justify-center transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Facebook" className="h-9 w-9 rounded-full border border-[color:var(--cream)]/20 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] flex items-center justify-center transition-colors">
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-[color:var(--cream)]/10 py-5 text-center text-xs text-[color:var(--cream)]/50">
        © {new Date().getFullYear()} ALKHAL ALDIMASHKI · {lang === "ar" ? "الخال الدمشقي" : "الخال الدمشقي"} · {t("footer.rights")}
      </div>
    </footer>
  );
}
