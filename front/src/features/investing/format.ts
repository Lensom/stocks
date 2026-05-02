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

/**
 * Parse investing UI dates the same way as the API (`%d.%m.%Y`, `%Y-%m-%d`, `%d-%m-%Y`).
 * `Date.parse` alone fails on `DD.MM.YYYY`, which is why capital charts were empty for many users.
 */
export function parseInvestingDateMs(input: string): number | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    const t = Date.UTC(y, m - 1, d);
    return Number.isFinite(t) ? t : null;
  }

  const dmyDot = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dmyDot) {
    const d = Number(dmyDot[1]);
    const m = Number(dmyDot[2]);
    const y = Number(dmyDot[3]);
    const t = Date.UTC(y, m - 1, d);
    return Number.isFinite(t) ? t : null;
  }

  const dmyDash = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyDash) {
    const d = Number(dmyDash[1]);
    const m = Number(dmyDash[2]);
    const y = Number(dmyDash[3]);
    const t = Date.UTC(y, m - 1, d);
    return Number.isFinite(t) ? t : null;
  }

  const yearOnly = raw.match(/^(\d{4})$/);
  if (yearOnly) {
    const y = Number(yearOnly[1]);
    const t = Date.UTC(y, 0, 1);
    return Number.isFinite(t) ? t : null;
  }

  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Short axis label (UTC), e.g. 31.12.21 — fits chart ticks better than full ISO. */
export function formatInvestingAxisDate(ms: number): string {
  const d = new Date(ms);
  const day = d.getUTCDate();
  const month = d.getUTCMonth() + 1;
  const yy = d.getUTCFullYear() % 100;
  return `${day}.${month}.${String(yy).padStart(2, "0")}`;
}

