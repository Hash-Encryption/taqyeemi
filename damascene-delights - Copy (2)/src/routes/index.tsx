import { createFileRoute } from "@tanstack/react-router";
import { I18nProvider } from "@/lib/i18n";
import { CartProvider } from "@/lib/cart";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Menu } from "@/components/site/Menu";
import { Footer } from "@/components/site/Footer";
import { CartDrawer } from "@/components/site/CartDrawer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ALKHAL ALDIMASHKI · الخال الدمشقي — Traditional Syrian Restaurant" },
      { name: "description", content: "Heritage Damascene cuisine — mezze, shawarma, and Syrian classics. Order via WhatsApp." },
      { property: "og:title", content: "ALKHAL ALDIMASHKI — Traditional Syrian Restaurant" },
      { property: "og:description", content: "Authentic Damascene mezze, kibbeh, tabbouleh and shawarma. Order via WhatsApp." },
      { property: "og:type", content: "restaurant" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <I18nProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Hero />
            <Menu />
          </main>
          <Footer />
          <CartDrawer />
        </div>
      </CartProvider>
    </I18nProvider>
  );
}
