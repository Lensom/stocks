export function parseUsd(input: string): number {
  const raw = String(input ?? "").trim().replace(/\s+/g, "");
  let normalized = raw;

  if (normalized.includes(",") && !normalized.includes(".")) {
    // EU decimal format: 11965,31 -> 11965.31
    normalized = normalized.replace(",", ".");
  } else if (normalized.includes(",") && normalized.includes(".")) {
    // Thousand separators: 11,965.31 -> 11965.31
    normalized = normalized.replace(/,/g, "");
  }

  const cleaned = normalized.replace(/[^0-9.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function formatUsd(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}$${abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function parsePercent(input: string): number {
  const cleaned = input.replace(/[^0-9.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

