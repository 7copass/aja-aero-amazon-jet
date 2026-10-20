export const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function money(v: number | null | undefined, currency: "BRL" | "USD" = "USD") {
  const n = Number(v ?? 0);
  return currency === "BRL" ? BRL.format(n) : USD.format(n);
}

export function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function fmtDateTime(d: string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function hoursSince(d: string | null | undefined) {
  if (!d) return Infinity;
  return (Date.now() - new Date(d).getTime()) / 36e5;
}

export function pct(v: number | null | undefined) {
  return `${Number(v ?? 0).toFixed(1)}%`;
}
