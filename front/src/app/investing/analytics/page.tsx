"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DonutChart } from "@/features/investing/charts/donut-chart";
import { parsePercent, parseUsd } from "@/features/investing/format";
import { useInvesting } from "@/state/investing-store";

const palette = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"];
const OTHER_COLOR = "#9ca3af";

function DarkBars({
  title,
  rows,
  valueFormatter,
  accent,
}: {
  title: string;
  rows: Array<{ label: string; value: number }>;
  valueFormatter: (value: number) => string;
  accent: string;
}) {
  const maxAbs = Math.max(1, ...rows.map((r) => Math.abs(r.value)));

  return (
    <article className="flex h-full flex-col rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#1f1c17]">{title}</h3>
        <button
          type="button"
          className="rounded-xl border border-black/10 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-[#6f675b] hover:bg-white"
        >
          {accent}
        </button>
      </div>
      <p className="mt-1 text-xs text-[#655d51]">Based on current holdings data.</p>
      <div className="mt-4 flex-1 rounded-xl border border-black/5 bg-[#faf8f2] p-3">
        {rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#7f7668]">No data yet</div>
        ) : null}
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {rows.map((r, idx) => {
            const width = (Math.abs(r.value) / maxAbs) * 100;
            const positive = r.value >= 0;
            return (
              <div key={`${r.label}-${idx}`} className="grid grid-cols-[94px_1fr_72px] items-center gap-2 text-xs">
                <span className="truncate text-[#3b352d]">{r.label}</span>
                <div className="h-5 overflow-hidden rounded bg-white">
                  <div
                    className={`h-full transition ${positive ? "bg-emerald-400/90" : "bg-rose-400/90"}`}
                    style={{ width: `${Math.max(6, width)}%` }}
                  />
                </div>
                <span className={`text-right font-medium ${positive ? "text-emerald-700" : "text-rose-700"}`}>
                  {valueFormatter(r.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

export default function InvestingAnalyticsPage() {
  const { holdings } = useInvesting();

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

  const gainLossRows = useMemo(() => {
    return holdings
      .map((h) => {
        const cost = h.shares * parseUsd(h.avgBuyPrice);
        const value = parseUsd(h.marketValue);
        const pct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
        return { label: h.ticker, value: pct };
      })
      .sort((a, b) => b.value - a.value);
  }, [holdings]);

  const sectorRows = useMemo(() => {
    const bySector = new Map<string, number>();
    for (const h of holdings) {
      const sector = h.industry || "Other";
      bySector.set(sector, (bySector.get(sector) ?? 0) + parseUsd(h.marketValue));
    }
    return [...bySector.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [holdings]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8f8676]">Investing</p>
          <h1 className="mt-1.5 text-3xl font-semibold text-[#1f1c17]">Analytics</h1>
          <p className="mt-1.5 text-sm text-[#655d51]">Analytics built from your holdings table.</p>
        </div>
        <Link
          href="/investing"
          className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-medium text-[#3b352d]"
        >
          Back
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2 md:[&>article]:h-full">
        <article className="flex h-full flex-col rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[#1f1c17]">Allocation by holdings</h2>
            <button
              type="button"
              className="rounded-xl border border-black/10 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-[#6f675b] hover:bg-white"
            >
              Live
            </button>
          </div>
          <div className="mt-3">
            <DonutChart title="By stocks" slices={allocationSlices} />
          </div>
        </article>
        <article className="flex h-full flex-col rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[#1f1c17]">Target by stocks</h2>
            <button
              type="button"
              className="rounded-xl border border-black/10 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-[#6f675b] hover:bg-white"
            >
              Plan
            </button>
          </div>
          <div className="mt-3">
            <DonutChart title="Target allocation" slices={targetSlices} />
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 md:[&>article]:h-full">
        <DarkBars
          title="Gain/Loss for Holdings"
          rows={gainLossRows}
          valueFormatter={(v) => `${v.toFixed(1)}%`}
          accent="Return"
        />
        <DarkBars
          title="Portfolio Value by Sector"
          rows={sectorRows}
          valueFormatter={(v) => `$${Math.round(v).toLocaleString("en-US")}`}
          accent="Value"
        />
      </section>
    </div>
  );
}

