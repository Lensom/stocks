"use client";

import { Fragment, useMemo } from "react";
import {
  investingMetaBadge,
  investingPageStack,
  investingPrimarySaveActive,
  investingPrimarySaveDisabled,
  investingTableScrollWrap,
  investingToolbarBtn,
} from "@/features/investing/ui/investing-classes";
import { useInvesting, type InvestingPickingRow } from "@/state/investing-store";

const BUCKET_ORDER = ["etf_reit_fund", "value_blue_chips"] as const;

const BUCKET_TITLE: Record<string, string> = {
  etf_reit_fund: "ETF / REIT / FUND (40%) · Max 5",
  value_blue_chips: "Value / Blue chips (40%) · Max 10",
};

const BUCKET_OPTIONS: { value: string; label: string }[] = [
  { value: "etf_reit_fund", label: "ETF / REIT / Fund" },
  { value: "value_blue_chips", label: "Value / Blue chips" },
];

function bucketSortKey(bucket: string): number {
  const i = BUCKET_ORDER.indexOf(bucket as (typeof BUCKET_ORDER)[number]);
  return i === -1 ? 100 : i;
}

function groupPickingRows(rows: InvestingPickingRow[]): { bucket: string; rows: InvestingPickingRow[] }[] {
  const sorted = [...rows].sort(
    (a, b) => bucketSortKey(a.bucket) - bucketSortKey(b.bucket) || a.ticker.localeCompare(b.ticker),
  );
  const map = new Map<string, InvestingPickingRow[]>();
  for (const r of sorted) {
    const key = r.bucket?.trim() || "other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  const keys = [...map.keys()].sort((a, b) => bucketSortKey(a) - bucketSortKey(b));
  return keys.map((bucket) => ({ bucket, rows: map.get(bucket)! }));
}

function inputBaseClasses() {
  return "w-full min-w-[4.5rem] rounded-lg border border-black/10 bg-white/90 px-2 py-1 text-sm text-[#2f2922] outline-none placeholder:text-[#b0a79a] focus:border-black/20 focus:bg-white";
}

function dayChangeClass(pct: string): string {
  const n = parseFloat(String(pct).replace("%", "").trim());
  if (!Number.isFinite(n) || !String(pct).trim()) return "text-[#6f675b]";
  if (n < 0) return "text-rose-600";
  if (n > 0) return "text-emerald-600";
  return "text-[#6f675b]";
}

function buyNowCellClass(row: InvestingPickingRow): string {
  if (row.buy_right_now.trim()) return "text-[#1f1c17] font-semibold";
  const px = parseFloat(row.current_price);
  const strong = parseFloat(row.strong_buy_until);
  const may = parseFloat(row.may_buy_until);
  if (!Number.isFinite(px)) return "text-[#8f8676]";
  if (Number.isFinite(strong) && px <= strong) return "text-emerald-700 font-semibold";
  if (Number.isFinite(may) && px <= may) return "text-amber-700 font-semibold";
  return "text-rose-700 font-semibold";
}

/** Editable columns only (market fields and buy-right-now come from quotes / rules). */
const BASE_EDIT_KEYS = ["name", "ticker", "industry", "pe", "eps", "beta", "div_yield"] as const;
const ZONE_PRICE_KEYS = ["strong_buy_until", "may_buy_until"] as const;
const GOAL_KEYS = ["price_goal_1y", "price_goal_5y"] as const;

const COL_COUNT = 17;

export default function InvestingPickingPage() {
  const {
    pickingRows,
    pickingMeta,
    isPickingLoading,
    isPickingSaving,
    isPickingDirty,
    addPickingRow,
    updatePickingRow,
    deletePickingRow,
    savePicking,
    refreshPicking,
  } = useInvesting();

  const grouped = useMemo(() => groupPickingRows(pickingRows), [pickingRows]);

  return (
    <div className={investingPageStack}>
      <p className="text-sm text-[#655d51]">
        Research buckets: notes and targets in the database; current price and day change from market quotes.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className={investingMetaBadge}>
          {pickingMeta.updatedAt
            ? `Synced ${new Date(pickingMeta.updatedAt).toLocaleString()}`
            : "Not synced"}
        </span>
        <button
          type="button"
          onClick={() => void refreshPicking()}
          disabled={isPickingLoading}
          className={`${investingToolbarBtn} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isPickingLoading ? "Loading…" : "Refresh quotes"}
        </button>
        <button type="button" onClick={addPickingRow} className={investingToolbarBtn}>
          Add row
        </button>
        <button
          type="button"
          onClick={() => void savePicking()}
          disabled={!isPickingDirty || isPickingSaving || isPickingLoading}
          className={[
            "transition",
            !isPickingDirty || isPickingSaving || isPickingLoading
              ? investingPrimarySaveDisabled
              : investingPrimarySaveActive,
          ].join(" ")}
        >
          {isPickingSaving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className={investingTableScrollWrap}>
        <table className="w-full min-w-[1900px] border-collapse text-left text-sm">
          <thead className="bg-[#f4efe4] text-xs text-[#7f7668]">
            <tr>
              <th className="px-2 py-2 font-medium">Bucket</th>
              <th className="px-2 py-2 font-medium">Name</th>
              <th className="px-2 py-2 font-medium">Ticker</th>
              <th className="px-2 py-2 font-medium">Industry</th>
              <th className="px-2 py-2 font-medium">P/E</th>
              <th className="px-2 py-2 font-medium">EPS</th>
              <th className="px-2 py-2 font-medium">Beta</th>
              <th className="px-2 py-2 font-medium">Div yield %</th>
              <th className="px-2 py-2 font-medium">Current price</th>
              <th className="px-2 py-2 font-medium">Day change %</th>
              <th className="px-2 py-2 font-medium">Strong buy until</th>
              <th className="px-2 py-2 font-medium">May buy until</th>
              <th className="px-2 py-2 font-medium">Buy right now?</th>
              <th className="px-2 py-2 font-medium">Price goal 1y</th>
              <th className="px-2 py-2 font-medium">Price goal 5y</th>
              <th className="min-w-[220px] px-2 py-2 font-medium">Notes</th>
              <th className="px-2 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map((group) => (
              <Fragment key={group.bucket}>
                <tr className="border-t border-black/10 bg-[#ebe6dc]">
                  <td colSpan={COL_COUNT} className="px-3 py-2 text-xs font-semibold text-[#1f1c17]">
                    {BUCKET_TITLE[group.bucket] ?? group.bucket}
                  </td>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.id} className="border-t border-black/5 align-top">
                    <td className="px-2 py-2">
                      <select
                        value={BUCKET_OPTIONS.some((o) => o.value === row.bucket) ? row.bucket : "value_blue_chips"}
                        onChange={(e) => updatePickingRow(row.id, { bucket: e.target.value })}
                        className={inputBaseClasses()}
                      >
                        {BUCKET_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    {BASE_EDIT_KEYS.map((key) => (
                      <td key={key} className="px-2 py-2">
                        <input
                          value={row[key] ?? ""}
                          onChange={(e) => updatePickingRow(row.id, { [key]: e.target.value })}
                          className={inputBaseClasses()}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-2">
                      <span className="block rounded-lg border border-black/5 bg-[#faf8f2] px-2 py-1 text-sm tabular-nums text-[#2f2922]">
                        {row.current_price.trim() ? row.current_price : "—"}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={[
                          "block rounded-lg border border-black/5 bg-[#faf8f2] px-2 py-1 text-sm tabular-nums",
                          dayChangeClass(row.day_change_pct),
                        ].join(" ")}
                      >
                        {row.day_change_pct.trim() ? row.day_change_pct : "—"}
                      </span>
                    </td>
                    {ZONE_PRICE_KEYS.map((key) => (
                      <td key={key} className="px-2 py-2">
                        <input
                          value={row[key] ?? ""}
                          onChange={(e) => updatePickingRow(row.id, { [key]: e.target.value })}
                          className={inputBaseClasses()}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-2">
                      <span
                        className={[
                          "block rounded-lg border border-black/5 bg-[#faf8f2] px-2 py-1 text-sm tabular-nums",
                          buyNowCellClass(row),
                        ].join(" ")}
                      >
                        {row.buy_right_now.trim()
                          ? row.buy_right_now
                          : row.current_price.trim()
                            ? row.current_price
                            : "—"}
                      </span>
                      <input
                        value={row.buy_right_now ?? ""}
                        onChange={(e) => updatePickingRow(row.id, { buy_right_now: e.target.value })}
                        placeholder="Override (optional)"
                        className={[inputBaseClasses(), "mt-1 text-xs"].join(" ")}
                      />
                    </td>
                    {GOAL_KEYS.map((key) => (
                      <td key={key} className="px-2 py-2">
                        <input
                          value={row[key] ?? ""}
                          onChange={(e) => updatePickingRow(row.id, { [key]: e.target.value })}
                          className={inputBaseClasses()}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-2">
                      <textarea
                        value={row.notes ?? ""}
                        onChange={(e) => updatePickingRow(row.id, { notes: e.target.value })}
                        rows={2}
                        className={[inputBaseClasses(), "min-h-[2.75rem] resize-y"].join(" ")}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button type="button" onClick={() => deletePickingRow(row.id)} className={investingToolbarBtn}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
            {pickingRows.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className="px-3 py-4 text-center text-xs text-[#8f8676]">
                  No picking rows yet. Seed the database or add a row.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
