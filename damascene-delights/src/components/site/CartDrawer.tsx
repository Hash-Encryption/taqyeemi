import { X, Plus, Minus, Trash2, MessageCircle } from "lucide-react";
import { useCart, WHATSAPP_NUMBER } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/formatters";

export function CartDrawer() {
  const { open, setOpen, lines, inc, dec, remove, clear, total, count } = useCart();
  const { t, tf, lang } = useI18n();

  const checkout = () => {
    if (!lines.length) return;
    const header = t("cart.msg.hello");
    const body = lines.map((l) => `• ${l.qty}× ${tf(l.item, "name")} — ${formatPrice(l.qty * l.item.price)}`).join("\n");
    const totalLine = `${t("cart.msg.total")}: ${formatPrice(total)}`;
    const text = `${header}\n\n${body}\n\n${totalLine}`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-[color:var(--charcoal)]/60 backdrop-blur-sm z-50 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`fixed top-0 z-50 h-full w-full sm:w-[420px] bg-[color:var(--cream)] shadow-2xl transition-transform duration-300 flex flex-col ${
          lang === "ar"
            ? `left-0 ${open ? "translate-x-0" : "-translate-x-full"}`
            : `right-0 ${open ? "translate-x-0" : "translate-x-full"}`
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-[color:var(--border)]">
          <div>
            <h3 className="font-display text-2xl text-[color:var(--charcoal)]">{t("cart.title")}</h3>
            <p className="text-xs text-[color:var(--muted-foreground)]">{count} {lang === "ar" ? "عنصر" : count === 1 ? "item" : "items"}</p>
          </div>
          <div className="flex items-center gap-2">
            {lines.length > 0 && (
              <button onClick={clear} className="text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--rose)] inline-flex items-center gap-1">
                <Trash2 className="h-3.5 w-3.5" /> {t("cart.clear")}
              </button>
            )}
            <button onClick={() => setOpen(false)} className="h-9 w-9 rounded-full hover:bg-[color:var(--muted)] flex items-center justify-center">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {lines.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center text-sm text-[color:var(--muted-foreground)] p-8">
              {t("cart.empty")}
            </div>
          ) : (
            lines.map((l) => (
              <div key={l.item.id} className="flex gap-3 border-b border-[color:var(--border)]/60 pb-4">
                <div className="flex-1 min-w-0">
                  <div className="font-display text-lg leading-tight text-[color:var(--charcoal)] truncate">
                    {tf(l.item, "name")}
                  </div>
                  <div className="text-xs text-[color:var(--muted-foreground)]">{formatPrice(l.item.price)} × {l.qty}</div>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]">
                    <button onClick={() => dec(l.item.id)} className="h-7 w-7 flex items-center justify-center hover:bg-[color:var(--muted)] rounded-full">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{l.qty}</span>
                    <button onClick={() => inc(l.item.id)} className="h-7 w-7 flex items-center justify-center hover:bg-[color:var(--muted)] rounded-full">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="text-right rtl:text-left">
                  <div className="text-[color:var(--rose)] font-semibold">{formatPrice(l.qty * l.item.price)}</div>
                  <button onClick={() => remove(l.item.id)} className="mt-2 text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--rose)]">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[color:var(--border)] p-5 space-y-3 bg-[color:var(--cream)]">
          <div className="flex items-center justify-between">
            <span className="text-sm uppercase tracking-widest text-[color:var(--muted-foreground)]">{t("cart.total")}</span>
            <span className="font-display text-3xl text-[color:var(--charcoal)]">{formatPrice(total)}</span>
          </div>
          <button
            onClick={checkout}
            disabled={!lines.length}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] hover:bg-[#1ebe57] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 shadow-[0_10px_30px_-10px_rgba(37,211,102,0.6)] transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            {t("cart.checkout")}
          </button>
        </div>
      </aside>
    </>
  );
}
