/** Parse numbers from spreadsheet-style crypto inputs (commas, no $). */
export function parseCryptoAmount(s: string): number {
  const raw = String(s ?? "").trim().replace(/\s/g, "");
  if (!raw) return 0;
  let n = raw;
  if (n.includes(",") && !n.includes(".")) {
    n = n.replace(",", ".");
  } else if (n.includes(",") && n.includes(".")) {
    n = n.replace(/,/g, "");
  }
  const cleaned = n.replace(/[^0-9.-]/g, "");
  const v = Number(cleaned);
  return Number.isFinite(v) ? v : 0;
}

export function formatCryptoUsd(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Map ticker to Yahoo pair (BTC → BTC-USD). */
export function yahooCryptoPair(symbol: string): string {
  const s = symbol.trim().toUpperCase();
  if (!s) return "";
  if (s.endsWith("-USD")) return s;
  return `${s}-USD`;
}
