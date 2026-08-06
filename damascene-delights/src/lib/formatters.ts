import type { Lang } from "@/lib/i18n";

export const RIYAL_SYMBOL = "\u20C1";

const MODERATE_WALK_CALORIES_PER_MINUTE = 4;

export function formatPrice(price: number) {
  return `${price} ${RIYAL_SYMBOL}`;
}

export function formatWalkingDuration(calories: number, lang: Lang) {
  if (calories <= 0) return lang === "ar" ? "0 د مشي" : "0 min walk";

  const minutes = Math.max(
    5,
    Math.round(calories / MODERATE_WALK_CALORIES_PER_MINUTE / 5) * 5,
  );
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return lang === "ar" ? `≈ ${minutes} د مشي` : `≈ ${minutes} min walk`;
  }

  const duration = remainingMinutes
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;

  return lang === "ar"
    ? `≈ ${duration.replace("h", " س").replace("m", " د")} مشي`
    : `≈ ${duration} walk`;
}
