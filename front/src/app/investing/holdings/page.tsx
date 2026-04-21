"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { useInvesting } from "@/state/investing-store";
import { formatPercent, formatUsd, parsePercent, parseUsd } from "@/features/investing/format";

function inputBaseClasses() {
  return "w-full rounded-lg border border-black/10 bg-white/90 px-2 py-1 text-sm text-[#2f2922] outline-none placeholder:text-[#b0a79a] focus:border-black/20 focus:bg-white";
}

type SortKey =
  | "ticker"
  | "targetWeight"
  | "currentWeight"
  | "shares"
  | "avgBuyPrice"
  | "marketPrice"
  | "marketValue"
  | "pnl";

export default function InvestingTablePage() {
  const {
    holdings,
    holdingsMeta,
    metrics,
    isMetricsLoading,
    refreshMetrics,
    updateHolding,
    addHolding,
    deleteHolding,
    reset,
    saveHoldings,
    refreshMarketPrices,
    isMarketPricesLoading,
    isHoldingsDirty,
    isHoldingsSaving,
  } = useInvesting();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<SortKey>("ticker");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const totals = useMemo(() => {
    const totalValue = holdings.reduce((a, h) => a + parseUsd(h.marketValue), 0);
    const totalTarget = holdings.reduce((a, h) => a + parsePercent(h.targetWeight), 0);
    const totalCurrent = holdings.reduce((a, h) => a + parsePercent(h.currentWeight), 0);
    return { totalValue, totalTarget, totalCurrent };
  }, [holdings]);

  const sortedHoldings = useMemo(() => {
    const factor = sortDir === "asc" ? 1 : -1;
    return [...holdings].sort((a, b) => {
      const compareNum = (x: number, y: number) => (x - y) * factor;
      const compareStr = (x: string, y: string) => x.localeCompare(y) * factor;

      switch (sortBy) {
        case "ticker":
          return compareStr(a.ticker, b.ticker);
        case "targetWeight":
          return compareNum(parsePercent(a.targetWeight), parsePercent(b.targetWeight));
        case "currentWeight":
          return compareNum(parsePercent(a.currentWeight), parsePercent(b.currentWeight));
        case "shares":
          return compareNum(a.shares, b.shares);
        case "avgBuyPrice":
          return compareNum(parseUsd(a.avgBuyPrice), parseUsd(b.avgBuyPrice));
        case "marketPrice":
          return compareNum(parseUsd(a.marketPrice), parseUsd(b.marketPrice));
        case "marketValue":
          return compareNum(parseUsd(a.marketValue), parseUsd(b.marketValue));
        case "pnl":
          return compareNum(parseUsd(a.pnl), parseUsd(b.pnl));
        default:
          return 0;
      }
    });
  }, [holdings, sortBy, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(key);
    setSortDir("asc");
  }

  function sortArrow(key: SortKey) {
    if (sortBy !== key) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  }

  function toggleExpanded(id: string) {
    setExpandedRowIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8f8676]">
            Investing
          </p>
          <h1 className="mt-1.5 text-3xl font-semibold text-[#1f1c17]">Holdings</h1>
          <p className="mt-1.5 text-sm text-[#655d51]">
            Editable spreadsheet-like holdings. Dashboard charts read from this table.
          </p>
        </div>
        <Link
          href="/investing"
          className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-medium text-[#3b352d]"
        >
          Back
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 text-xs text-[#6f675b]">
          <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1">
            Total value {formatUsd(totals.totalValue)}
          </span>
          <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1">
            Target sum {formatPercent(totals.totalTarget)}
          </span>
          <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1">
            Current sum {formatPercent(totals.totalCurrent)}
          </span>
          <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1">
            Source {holdingsMeta.source}
            {holdingsMeta.updatedAt ? ` · synced ${new Date(holdingsMeta.updatedAt).toLocaleString()}` : ""}
          </span>
          <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1">
            Div Yield {isMetricsLoading ? "…" : metrics.divYieldPercent}
          </span>
          <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1">
            Beta {isMetricsLoading ? "…" : metrics.beta}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void refreshMarketPrices().catch(() => {})}
            disabled={isMarketPricesLoading}
            className={[
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition",
              isMarketPricesLoading
                ? "cursor-not-allowed bg-black/10 text-[#6f675b]"
                : "border border-black/10 bg-white text-[#3b352d] hover:bg-[#faf8f2]",
            ].join(" ")}
          >
            {isMarketPricesLoading ? "Refreshing…" : "Refresh market"}
          </button>
          <button
            onClick={() => void refreshMetrics().catch(() => {})}
            disabled={isMetricsLoading}
            className={[
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition",
              isMetricsLoading
                ? "cursor-not-allowed bg-black/10 text-[#6f675b]"
                : "border border-black/10 bg-white text-[#3b352d] hover:bg-[#faf8f2]",
            ].join(" ")}
          >
            {isMetricsLoading ? "Refreshing metrics…" : "Refresh metrics"}
          </button>
          <div className="flex rounded-full border border-black/10 bg-white p-1">
            <button
              type="button"
              onClick={() => setMode("view")}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                mode === "view" ? "bg-[#f3efe5] text-[#1f1c17]" : "text-[#6f675b] hover:bg-[#faf8f2]",
              ].join(" ")}
            >
              View
            </button>
            <button
              type="button"
              onClick={() => setMode("edit")}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                mode === "edit" ? "bg-[#f3efe5] text-[#1f1c17]" : "text-[#6f675b] hover:bg-[#faf8f2]",
              ].join(" ")}
            >
              Edit
            </button>
          </div>

          {mode === "edit" ? (
            <>
              <button
                onClick={() => void saveHoldings().catch(() => {})}
                disabled={!isHoldingsDirty || isHoldingsSaving}
                className={[
                  "rounded-full px-3.5 py-1.5 text-xs font-medium transition",
                  !isHoldingsDirty || isHoldingsSaving
                    ? "cursor-not-allowed bg-black/10 text-[#6f675b]"
                    : "bg-[#1f1c17] text-[#f8f4eb] hover:bg-[#2c2923]",
                ].join(" ")}
              >
                {isHoldingsSaving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={addHolding}
                className="rounded-full bg-[#1f1c17] px-3.5 py-1.5 text-xs font-medium text-[#f8f4eb] transition hover:bg-[#2c2923]"
              >
                Add row
              </button>
              <button
                onClick={reset}
                className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-medium text-[#3b352d]"
              >
                Reset
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white/90 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-left tabular-nums">
            <thead className="sticky top-0 z-10 bg-[#f4efe4] text-xs text-[#7f7668]">
            <tr>
              <th className="w-[52px] px-2 py-2 font-medium" />
              <th className="w-[88px] px-2 py-2 font-medium">
                <button type="button" onClick={() => toggleSort("ticker")} className="inline-flex items-center gap-1">
                  Ticker <span>{sortArrow("ticker")}</span>
                </button>
              </th>
              <th className="w-[180px] px-2 py-2 text-left font-medium">Name</th>
              <th className="w-[80px] px-2 py-2 text-left font-medium">
                <button type="button" onClick={() => toggleSort("targetWeight")} className="inline-flex items-center gap-1">
                  Target <span>{sortArrow("targetWeight")}</span>
                </button>
              </th>
              <th className="w-[80px] px-2 py-2 text-left font-medium">
                <button type="button" onClick={() => toggleSort("currentWeight")} className="inline-flex items-center gap-1">
                  Current <span>{sortArrow("currentWeight")}</span>
                </button>
              </th>
              <th className="w-[62px] px-2 py-2 text-left font-medium">
                <button type="button" onClick={() => toggleSort("shares")} className="inline-flex items-center gap-1">
                  Shares <span>{sortArrow("shares")}</span>
                </button>
              </th>
              <th className="w-[90px] px-2 py-2 text-left font-medium">
                <button type="button" onClick={() => toggleSort("avgBuyPrice")} className="inline-flex items-center gap-1">
                  Avg buy <span>{sortArrow("avgBuyPrice")}</span>
                </button>
              </th>
              <th className="w-[90px] px-2 py-2 text-left font-medium">
                <button type="button" onClick={() => toggleSort("marketPrice")} className="inline-flex items-center gap-1">
                  Market <span>{sortArrow("marketPrice")}</span>
                </button>
              </th>
              <th className="w-[94px] px-2 py-2 text-left font-medium">
                <button type="button" onClick={() => toggleSort("marketValue")} className="inline-flex items-center gap-1">
                  Value <span>{sortArrow("marketValue")}</span>
                </button>
              </th>
              <th className="w-[110px] px-2 py-2 font-medium">
                <button type="button" onClick={() => toggleSort("pnl")} className="inline-flex items-center gap-1">
                  P&L <span>{sortArrow("pnl")}</span>
                </button>
              </th>
              {mode === "edit" ? <th className="w-[88px] px-2 py-2 font-medium">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {sortedHoldings.map((h) => (
              <Fragment key={h.id}>
                <tr
                  className="border-t border-black/5 align-top transition hover:bg-[#faf8f2]"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest("input,button,a")) return;
                    toggleExpanded(h.id);
                  }}
                >
                {mode === "edit" ? (
                  <>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(h.id)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-black/10 text-sm font-semibold text-[#6f675b] hover:bg-[#f4efe4]"
                      >
                        {expandedRowIds[h.id] ? "−" : "+"}
                      </button>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={h.ticker}
                        onChange={(e) => updateHolding(h.id, { ticker: e.target.value.toUpperCase() })}
                        className={`${inputBaseClasses()} font-semibold`}
                        placeholder="AAPL"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={h.name}
                        onChange={(e) => updateHolding(h.id, { name: e.target.value })}
                        className={inputBaseClasses()}
                        placeholder="Company name"
                      />
                    </td>
                    <td className="px-2 py-2 text-left">
                      <input
                        value={h.targetWeight}
                        onChange={(e) => updateHolding(h.id, { targetWeight: e.target.value })}
                        onBlur={() =>
                          updateHolding(h.id, {
                            targetWeight: formatPercent(parsePercent(h.targetWeight)),
                          })
                        }
                        className={`${inputBaseClasses()} text-left tabular-nums`}
                        inputMode="decimal"
                        placeholder="10.0%"
                      />
                    </td>
                    <td className="px-2 py-2 text-left">
                      <div className="w-full rounded-lg border border-black/10 bg-[#faf8f2] px-2 py-1.5 text-left text-sm font-semibold tabular-nums text-[#2f2922]">
                        {formatPercent(parsePercent(h.currentWeight))}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-left">
                      <input
                        value={String(h.shares)}
                        onChange={(e) => updateHolding(h.id, { shares: Number(e.target.value) || 0 })}
                        className={`${inputBaseClasses()} text-left tabular-nums`}
                        inputMode="numeric"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-2 py-2 text-left">
                      <input
                        value={h.avgBuyPrice}
                        onChange={(e) => updateHolding(h.id, { avgBuyPrice: e.target.value })}
                        onBlur={() =>
                          updateHolding(h.id, { avgBuyPrice: formatUsd(parseUsd(h.avgBuyPrice)) })
                        }
                        className={`${inputBaseClasses()} text-left tabular-nums`}
                        inputMode="decimal"
                        placeholder="$0.00"
                      />
                    </td>
                    <td className="px-2 py-2 text-left">
                      <input
                        value={h.marketPrice}
                        onChange={(e) => updateHolding(h.id, { marketPrice: e.target.value })}
                        onBlur={() =>
                          updateHolding(h.id, { marketPrice: formatUsd(parseUsd(h.marketPrice)) })
                        }
                        className={`${inputBaseClasses()} text-left tabular-nums`}
                        inputMode="decimal"
                        placeholder="$0.00"
                      />
                    </td>
                    <td className="px-2 py-2 text-left">
                      <input
                        value={h.marketValue}
                        onChange={(e) => updateHolding(h.id, { marketValue: e.target.value })}
                        onBlur={() =>
                          updateHolding(h.id, { marketValue: formatUsd(parseUsd(h.marketValue)) })
                        }
                        className={`${inputBaseClasses()} text-left tabular-nums`}
                        inputMode="decimal"
                        placeholder="$0.00"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <div
                        className={[
                          "w-full rounded-lg border border-black/10 bg-[#faf8f2] px-2 py-1.5 text-sm font-semibold tabular-nums",
                          parseUsd(h.pnl) >= 0 ? "text-emerald-700" : "text-rose-700",
                        ].join(" ")}
                      >
                        {formatUsd(parseUsd(h.pnl))}
                      </div>
                    </td>
                    {mode === "edit" ? (
                      <td className="px-2 py-2">
                        <button
                          onClick={() => deleteHolding(h.id)}
                          className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[#3b352d] hover:bg-[#faf8f2]"
                          type="button"
                        >
                          Delete
                        </button>
                      </td>
                    ) : null}
                  </>
                ) : (
                  <>
                    <td className="px-2 py-2 text-center text-sm text-[#8f8676]">
                      {expandedRowIds[h.id] ? "−" : "+"}
                    </td>
                    <td className="px-2 py-2 text-sm font-semibold text-[#2f2922]">{h.ticker}</td>
                    <td className="px-2 py-2 text-sm text-[#2f2922]">{h.name}</td>
                    <td className="px-2 py-2 text-left text-sm tabular-nums text-[#2f2922] whitespace-nowrap">
                      {formatPercent(parsePercent(h.targetWeight))}
                    </td>
                    <td className="px-2 py-2 text-left text-sm tabular-nums text-[#2f2922] whitespace-nowrap">
                      {formatPercent(parsePercent(h.currentWeight))}
                    </td>
                    <td className="px-2 py-2 text-left text-sm tabular-nums text-[#2f2922] whitespace-nowrap">
                      {h.shares}
                    </td>
                    <td className="px-2 py-2 text-left text-sm tabular-nums text-[#2f2922] whitespace-nowrap">
                      {formatUsd(parseUsd(h.avgBuyPrice))}
                    </td>
                    <td className="px-2 py-2 text-left text-sm tabular-nums text-[#2f2922] whitespace-nowrap">
                      {formatUsd(parseUsd(h.marketPrice))}
                    </td>
                    <td className="px-2 py-2 text-left text-sm tabular-nums text-[#2f2922] whitespace-nowrap">
                      {formatUsd(parseUsd(h.marketValue))}
                    </td>
                    <td className="px-2 py-2 text-left">
                      <span
                        className={[
                          "inline-flex min-w-[96px] justify-start rounded-full border border-black/10 bg-[#faf8f2] px-2.5 py-1 text-xs font-semibold tabular-nums whitespace-nowrap",
                          parseUsd(h.pnl) >= 0 ? "text-emerald-700" : "text-rose-700",
                        ].join(" ")}
                      >
                        {formatUsd(parseUsd(h.pnl))}
                      </span>
                    </td>
                  </>
                )}
                </tr>
                {expandedRowIds[h.id] ? (
                  <tr className="border-t border-black/5 bg-[#faf8f2]/70">
                    <td colSpan={mode === "edit" ? 11 : 10} className="px-4 py-3 text-sm">
                      {mode === "edit" ? (
                        <div className="grid gap-2 md:grid-cols-2">
                          <label className="text-xs text-[#6f675b]">
                            Industry
                            <input
                              value={h.industry}
                              onChange={(e) => updateHolding(h.id, { industry: e.target.value })}
                              className={`${inputBaseClasses()} mt-1`}
                              placeholder="ETF / Tech / ..."
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="grid gap-1">
                          <p className="text-xs text-[#8f8676]">
                            <span className="font-medium text-[#655d51]">Industry:</span> {h.industry}
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
