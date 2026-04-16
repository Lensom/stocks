"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useInvesting } from "@/state/investing-store";
import { parsePercent, parseUsd } from "@/features/investing/format";
import { DonutChart } from "@/features/investing/charts/donut-chart";
import { DriftBars } from "@/features/investing/charts/drift-bars";
import { Sparkline } from "@/features/investing/charts/sparkline";
import { PortfolioSummary } from "@/features/investing/portfolio-summary";

const palette = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"];
const OTHER_COLOR = "#9ca3af";

export default function InvestingDashboardPage() {
  const {
    holdings,
    capitalEntries,
    updateCapitalEntry,
    addCapitalEntry,
    deleteCapitalEntry,
    saveCapitalEntries,
    isCapitalEntriesDirty,
    isCapitalEntriesSaving,
  } = useInvesting();
  const [isEditingEntries, setEditingEntries] = useState(false);
  const [chartModal, setChartModal] = useState<null | "allocation" | "target">(null);
  const [hoveredSliceLabel, setHoveredSliceLabel] = useState<string | null>(null);
  const [capitalTrendOpen, setCapitalTrendOpen] = useState(false);
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState<{
    x: number;
    y: number;
    year: string;
    value: number;
  } | null>(null);

  const totalValue = useMemo(() => holdings.reduce((a, h) => a + parseUsd(h.marketValue), 0), [holdings]);
  const totalCost = useMemo(
    () => holdings.reduce((a, h) => a + h.shares * parseUsd(h.avgBuyPrice), 0),
    [holdings],
  );
  const totalGainLoss = useMemo(() => totalValue - totalCost, [totalValue, totalCost]);

  const allocationSlices = useMemo(() => {
    const byTickerValue = new Map<string, number>();
    let portfolioTotal = 0;

    for (const h of holdings) {
      const key = h.ticker || "—";
      const value = parseUsd(h.marketValue);
      portfolioTotal += value;
      byTickerValue.set(key, (byTickerValue.get(key) ?? 0) + value);
    }

    if (portfolioTotal <= 0) return [];

    const entries = [...byTickerValue.entries()]
      .map(([label, value]) => [label, (value / portfolioTotal) * 100] as const)
      .sort((a, b) => b[1] - a[1]);

    const top = entries.slice(0, 6);
    const other = entries.slice(6).reduce((acc, [, v]) => acc + v, 0);
    const merged = other > 0 ? [...top, ["Other", other] as const] : top;

    return merged.map(([label, value], idx) => ({
      label,
      value,
      color: label === "Other" ? OTHER_COLOR : palette[idx % palette.length]!,
    }));
  }, [holdings]);

  const allocationSlicesFull = useMemo(() => {
    const byTickerValue = new Map<string, number>();
    let portfolioTotal = 0;

    for (const h of holdings) {
      const key = h.ticker || "—";
      const value = parseUsd(h.marketValue);
      portfolioTotal += value;
      byTickerValue.set(key, (byTickerValue.get(key) ?? 0) + value);
    }
    if (portfolioTotal <= 0) return [];

    return [...byTickerValue.entries()]
      .map(([label, value], idx) => ({
        label,
        value: (value / portfolioTotal) * 100,
        color: palette[idx % palette.length]!,
      }))
      .sort((a, b) => b.value - a.value);
  }, [holdings]);

  const targetSlices = useMemo(() => {
    const rows = holdings
      .map((h) => ({ label: h.ticker || "—", value: Math.max(0, parsePercent(h.targetWeight)) }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
    const top = rows.slice(0, 6);
    const other = rows.slice(6).reduce((acc, r) => acc + r.value, 0);
    const merged = other > 0 ? [...top, { label: "Other", value: other }] : top;
    return merged.map((r, idx) => ({
      ...r,
      color: r.label === "Other" ? OTHER_COLOR : palette[idx % palette.length]!,
    }));
  }, [holdings]);

  const targetSlicesFull = useMemo(() => {
    const rows = holdings
      .map((h) => ({ label: h.ticker || "—", value: Math.max(0, parsePercent(h.targetWeight)) }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
    return rows.map((r, idx) => ({ ...r, color: palette[idx % palette.length]! }));
  }, [holdings]);

  const driftRows = useMemo(() => {
    return holdings
      .map((h) => ({
        label: h.ticker,
        target: parsePercent(h.targetWeight),
        current: parsePercent(h.currentWeight),
      }))
      .sort((a, b) => Math.abs(b.current - b.target) - Math.abs(a.current - a.target))
      .slice(0, 6);
  }, [holdings]);

  const depositsSeries = useMemo(() => capitalEntries.map((d) => parseUsd(d.total_value)), [capitalEntries]);
  const capitalTrend = useMemo(() => {
    const points = capitalEntries.map((d) => {
      const parts = d.date.split(/[.\-/]/);
      const year = parts.length >= 3 ? parts[2] : d.date;
      return { year, value: parseUsd(d.total_value) };
    });
    const values = points.map((p) => p.value);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 0;
    const width = 760;
    const height = 260;
    const innerW = width - 80;
    const innerH = height - 70;
    const range = max - min || 1;
    const path = points
      .map((p, i) => {
        const x = 40 + (i / Math.max(1, points.length - 1)) * innerW;
        const y = 20 + innerH - ((p.value - min) / range) * innerH;
        return `${x},${y}`;
      })
      .join(" ");
    return { points, min, max, width, height, path };
  }, [capitalEntries]);

  const modalSlices = chartModal === "target" ? targetSlicesFull : allocationSlicesFull;
  const hoveredSlice = modalSlices.find((s) => s.label === hoveredSliceLabel) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8f8676]">
            Investing
          </p>
          <h1 className="mt-1.5 text-3xl font-semibold text-[#1f1c17]">Dashboard</h1>
          <p className="mt-1.5 text-sm text-[#655d51]">
            Mock metrics to shape the UX.
          </p>
        </div>
        <Link
          href="/investing"
          className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-medium text-[#3b352d]"
        >
          Back
        </Link>
      </div>

      <PortfolioSummary />

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
          <p className="text-xs text-[#7f7668]">Total value</p>
          <p className="mt-1.5 text-xl font-semibold text-[#1f1c17]">
            ${totalValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </p>
        </article>
        <article className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
          <p className="text-xs text-[#7f7668]">Gain/Loss, $</p>
          <p className="mt-1.5 text-xl font-semibold text-[#1f1c17]">
            {totalGainLoss >= 0 ? "+" : "-"}$
            {Math.abs(totalGainLoss).toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </p>
        </article>
        <article className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
          <p className="text-xs text-[#7f7668]">Holdings</p>
          <p className="mt-1.5 text-xl font-semibold text-[#1f1c17]">
            {holdings.length}
          </p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
          <h2 className="text-sm font-semibold text-[#1f1c17]">Allocation by holdings</h2>
          <div className="mt-3">
            <DonutChart
              title="By stocks"
              slices={allocationSlices}
              onChartClick={() => {
                setHoveredSliceLabel(null);
                setChartModal("allocation");
              }}
            />
          </div>
        </article>
        <article className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
          <h2 className="text-sm font-semibold text-[#1f1c17]">Target by stocks</h2>
          <div className="mt-3">
            <DonutChart
              title="Target allocation"
              slices={targetSlices}
              onChartClick={() => {
                setHoveredSliceLabel(null);
                setChartModal("target");
              }}
            />
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#1f1c17]">Entry per capital</h2>
              <p className="mt-1 text-xs text-[#655d51]">Deposits and portfolio total over time.</p>
            </div>
            <button
              type="button"
              onClick={() => setCapitalTrendOpen(true)}
              className="rounded-xl border border-black/10 bg-white/70 p-1 hover:bg-white"
              title="Open full chart"
            >
              <Sparkline values={depositsSeries} />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {isEditingEntries ? (
              <>
                <button
                  type="button"
                  onClick={() => void saveCapitalEntries()}
                  disabled={!isCapitalEntriesDirty || isCapitalEntriesSaving}
                  className={[
                    "rounded-full px-3 py-1.5 text-xs font-medium transition",
                    !isCapitalEntriesDirty || isCapitalEntriesSaving
                      ? "cursor-not-allowed bg-black/10 text-[#6f675b]"
                      : "bg-[#1f1c17] text-[#f8f4eb] hover:bg-[#2c2923]",
                  ].join(" ")}
                >
                  {isCapitalEntriesSaving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={addCapitalEntry}
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[#3b352d] hover:bg-[#faf8f2]"
                >
                  Add row
                </button>
                <button
                  type="button"
                  onClick={() => setEditingEntries(false)}
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[#3b352d] hover:bg-[#faf8f2]"
                >
                  Done
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditingEntries(true)}
                className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[#3b352d] hover:bg-[#faf8f2]"
              >
                Edit table
              </button>
            )}
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-black/5">
            <table className="w-full border-collapse text-left">
              <thead className="bg-[#f4efe4] text-xs text-[#7f7668]">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Date</th>
                  <th className="px-3 py-2.5 text-right font-medium">Invested sum</th>
                  <th className="px-3 py-2.5 text-right font-medium">Total value</th>
                  <th className="px-3 py-2.5 text-right font-medium">%</th>
                  <th className="px-3 py-2.5 text-right font-medium">1Y</th>
                  {isEditingEntries ? <th className="px-3 py-2.5 text-right font-medium">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {capitalEntries.map((d) => (
                  <tr key={d.id} className="border-t border-black/5 text-sm">
                    <td className="px-3 py-2.5 text-[#2f2922]">
                      {isEditingEntries ? (
                        <input
                          value={d.date}
                          onChange={(e) => updateCapitalEntry(d.id, { date: e.target.value })}
                          className="w-[120px] rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm outline-none"
                        />
                      ) : (
                        d.date
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[#2f2922]">
                      {isEditingEntries ? (
                        <input
                          value={d.deposit}
                          onChange={(e) => updateCapitalEntry(d.id, { deposit: e.target.value })}
                          className="w-[110px] rounded-lg border border-black/10 bg-white px-2 py-1.5 text-right text-sm outline-none"
                        />
                      ) : (
                        d.deposit
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[#2f2922]">
                      {isEditingEntries ? (
                        <input
                          value={d.total_value}
                          onChange={(e) => updateCapitalEntry(d.id, { total_value: e.target.value })}
                          className="w-[110px] rounded-lg border border-black/10 bg-white px-2 py-1.5 text-right text-sm outline-none"
                        />
                      ) : (
                        d.total_value
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[#2f2922]">{d.roi_percent}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[#2f2922]">{d.one_year_percent}</td>
                    {isEditingEntries ? (
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => deleteCapitalEntry(d.id)}
                          className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[#3b352d] hover:bg-[#faf8f2]"
                        >
                          Delete
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
          <h2 className="text-sm font-semibold text-[#1f1c17]">Drift (target vs current)</h2>
          <div className="mt-3">
            <DriftBars rows={driftRows} />
          </div>
        </article>
      </section>

      {chartModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-black/10 bg-white p-5 shadow-[0_20px_60px_rgba(18,16,13,0.25)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#1f1c17]">
                {chartModal === "allocation" ? "Allocation by holdings" : "Target by stocks"}
              </h3>
              <button
                type="button"
                onClick={() => setChartModal(null)}
                className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[#3b352d] hover:bg-[#faf8f2]"
              >
                Close
              </button>
            </div>
            <DonutChart
              title={chartModal === "allocation" ? "By stocks" : "Target allocation"}
              slices={modalSlices}
              size={320}
              onSliceHover={(slice) => setHoveredSliceLabel(slice?.label ?? null)}
            />
            <div className="mt-4 rounded-xl border border-black/5 bg-[#faf8f2] px-4 py-3 text-sm text-[#3b352d]">
              {hoveredSlice ? (
                <span>
                  <span className="font-semibold">{hoveredSlice.label}</span>: {hoveredSlice.value.toFixed(2)}%
                </span>
              ) : (
                <span>Hover a sector to see details</span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {capitalTrendOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-black/10 bg-white p-5 shadow-[0_20px_60px_rgba(18,16,13,0.25)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#1f1c17]">Portfolio trend by years</h3>
              <button
                type="button"
                onClick={() => setCapitalTrendOpen(false)}
                className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[#3b352d] hover:bg-[#faf8f2]"
              >
                Close
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-black/10 bg-[#faf8f2] p-3">
              <svg width="100%" viewBox={`0 0 ${capitalTrend.width} ${capitalTrend.height}`}>
                <line x1="40" y1="20" x2="40" y2="210" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
                <line x1="40" y1="210" x2="720" y2="210" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
                <text x="34" y="24" textAnchor="end" fontSize="10" fill="#8f8676">
                  ${capitalTrend.max.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </text>
                <text x="34" y="118" textAnchor="end" fontSize="10" fill="#8f8676">
                  ${((capitalTrend.min + capitalTrend.max) / 2).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </text>
                <text x="34" y="214" textAnchor="end" fontSize="10" fill="#8f8676">
                  ${capitalTrend.min.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </text>
                <polyline
                  points={capitalTrend.path}
                  fill="none"
                  stroke="#1f1c17"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {capitalTrend.points.map((p, i) => {
                  const x = 40 + (i / Math.max(1, capitalTrend.points.length - 1)) * (capitalTrend.width - 80);
                  const y =
                    20 +
                    (capitalTrend.height - 70) -
                    ((p.value - capitalTrend.min) / (capitalTrend.max - capitalTrend.min || 1)) *
                      (capitalTrend.height - 70);
                  return (
                    <g key={`${p.year}-${i}`}>
                      <circle
                        cx={x}
                        cy={y}
                        r="5"
                        fill="#1f1c17"
                        onMouseEnter={() => setHoveredTrendPoint({ x, y, year: p.year, value: p.value })}
                        onMouseLeave={() => setHoveredTrendPoint(null)}
                      />
                      <text x={x} y="232" textAnchor="middle" fontSize="11" fill="#6f675b">
                        {p.year}
                      </text>
                    </g>
                  );
                })}
                {hoveredTrendPoint ? (
                  <g>
                    <rect
                      x={Math.max(48, hoveredTrendPoint.x - 78)}
                      y={Math.max(10, hoveredTrendPoint.y - 42)}
                      width="156"
                      height="30"
                      rx="8"
                      fill="white"
                      stroke="rgba(0,0,0,0.12)"
                    />
                    <text
                      x={Math.max(56, hoveredTrendPoint.x - 70)}
                      y={Math.max(28, hoveredTrendPoint.y - 24)}
                      fontSize="11"
                      fill="#1f1c17"
                    >
                      {hoveredTrendPoint.year}: $
                      {hoveredTrendPoint.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                    </text>
                  </g>
                ) : null}
              </svg>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
