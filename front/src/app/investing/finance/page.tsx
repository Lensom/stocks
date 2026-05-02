"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { YearlyInvestmentsBarChart } from "@/features/investing/charts/yearly-investments-bar-chart";
import { formatUsd, parseUsd } from "@/features/investing/format";
import {
  investingMetaBadge,
  investingPageStack,
  investingPrimarySaveActive,
  investingPrimarySaveDisabled,
  investingSubsectionStack,
  investingTableScrollWrap,
  investingToolbarBtn,
} from "@/features/investing/ui/investing-classes";
import { InvestingSubsectionHeader } from "@/features/investing/ui/investing-subsection-header";
import { useInvesting } from "@/state/investing-store";

function inputBaseClasses() {
  return "w-full rounded-lg border border-black/10 bg-white/90 px-2 py-1 text-sm text-[#2f2922] outline-none placeholder:text-[#b0a79a] focus:border-black/20 focus:bg-white";
}

function parseRefillYear(dateStr: string): number | null {
  const s = dateStr.trim();
  if (!s) return null;
  const iso = s.match(/^(\d{4})-\d{2}-\d{2}/);
  if (iso) return parseInt(iso[1]!, 10);
  const eu = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (eu) return parseInt(eu[3]!, 10);
  const tail = s.match(/(\d{4})$/);
  if (tail) return parseInt(tail[1]!, 10);
  return null;
}

function yearlyInvestFromRefills(
  rows: { date: string; amount: string }[],
): { year: number; value: number }[] {
  const byYear = new Map<number, number>();
  for (const r of rows) {
    const y = parseRefillYear(r.date);
    if (y === null) continue;
    byYear.set(y, (byYear.get(y) ?? 0) + parseUsd(r.amount));
  }
  if (byYear.size === 0) return [];
  const years = [...byYear.keys()].sort((a, b) => a - b);
  const from = years[0]!;
  const to = years[years.length - 1]!;
  const out: { year: number; value: number }[] = [];
  for (let y = from; y <= to; y++) {
    out.push({ year: y, value: byYear.get(y) ?? 0 });
  }
  return out;
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <article className="rounded-2xl border border-black/5 bg-white/90 p-4 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
      <p className="text-xs text-[#7f7668]">{label}</p>
      <p className="mt-1.5 text-lg font-semibold tabular-nums text-[#1f1c17]">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-[#8f8676]">{hint}</p> : null}
    </article>
  );
}

export default function InvestingFinancePage() {
  const {
    refills,
    operatingExpensesUsd,
    refillsMeta,
    isRefillsLoading,
    isRefillsSaving,
    isRefillsDirty,
    holdings,
    updateRefill,
    addRefill,
    deleteRefill,
    setOperatingExpensesUsd,
    saveRefills,
    refreshRefills,
  } = useInvesting();

  const currentValue = useMemo(
    () => holdings.reduce((a, h) => a + parseUsd(h.marketValue), 0),
    [holdings],
  );

  const { totalInvested, totalCommission } = useMemo(() => {
    let inv = 0;
    let comm = 0;
    for (const r of refills) {
      inv += parseUsd(r.amount);
      comm += parseUsd(r.commission);
    }
    return { totalInvested: inv, totalCommission: comm };
  }, [refills]);

  const operatingExpenses = useMemo(() => {
    if (!operatingExpensesUsd.trim()) return totalCommission;
    return parseUsd(operatingExpensesUsd);
  }, [operatingExpensesUsd, totalCommission]);

  const netAfterFees = totalInvested - operatingExpenses;
  const gainOnGrossPct = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;
  const gainOnNetPct = netAfterFees > 0 ? ((currentValue - netAfterFees) / netAfterFees) * 100 : 0;

  const yearlyBars = useMemo(() => yearlyInvestFromRefills(refills), [refills]);

  const yearlyTable = useMemo(() => {
    return yearlyBars.map((p) => ({
      year: p.year,
      sum: p.value,
    }));
  }, [yearlyBars]);

  const usingDefaultOperating = !operatingExpensesUsd.trim();

  const [isYearlyOpen, setYearlyOpen] = useState(true);
  const [isRefillsOpen, setRefillsOpen] = useState(true);

  return (
    <div className={investingPageStack}>
      <p className="text-sm text-[#655d51]">
        Account refills (deposits), commissions, and performance vs. current portfolio value. Purchases and sales:{" "}
        <Link
          href="/investing/activities"
          className="font-medium text-[#3b352d] underline decoration-black/15 underline-offset-2 hover:text-[#1f1c17]"
        >
          Activities
        </Link>
        .
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className={investingMetaBadge}>
          {refillsMeta.updatedAt
            ? `Synced ${new Date(refillsMeta.updatedAt).toLocaleString()}`
            : "Not synced"}
        </span>
        <button
          type="button"
          onClick={() => void refreshRefills()}
          disabled={isRefillsLoading}
          className={`${investingToolbarBtn} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isRefillsLoading ? "Loading…" : "Reload"}
        </button>
        <button type="button" onClick={addRefill} className={investingToolbarBtn}>
          Add refill
        </button>
        <button
          type="button"
          onClick={() => void saveRefills()}
          disabled={!isRefillsDirty || isRefillsSaving || isRefillsLoading}
          className={[
            "transition",
            !isRefillsDirty || isRefillsSaving || isRefillsLoading
              ? investingPrimarySaveDisabled
              : investingPrimarySaveActive,
          ].join(" ")}
        >
          {isRefillsSaving ? "Saving…" : "Save"}
        </button>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Operating expenses, $"
          value={formatUsd(operatingExpenses)}
          hint={
            usingDefaultOperating
              ? "From sum of refill commissions (override below)."
              : "Manual override is active."
          }
        />
        <StatCard label="Current value" value={formatUsd(currentValue)} hint="Live from holdings quotes." />
        <StatCard label="Total topped" value={formatUsd(totalInvested)} hint="Sum of Invest column." />
        <StatCard
          label="Topped − fee"
          value={formatUsd(netAfterFees)}
          hint="Total topped minus operating expenses."
        />
        <StatCard
          label="Total %"
          value={`${gainOnGrossPct.toFixed(2)}%`}
          hint="(Current − topped) / topped."
        />
        <StatCard
          label="Total, − fee %"
          value={`${gainOnNetPct.toFixed(2)}%`}
          hint="(Current − net after fees) / net after fees."
        />
      </section>

      <section className={investingSubsectionStack}>
        <InvestingSubsectionHeader
          title="Yearly overview"
          isOpen={isYearlyOpen}
          onToggle={() => setYearlyOpen((v) => !v)}
        />
        {isYearlyOpen ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <article className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
              <h3 className="text-sm font-semibold text-[#1f1c17]">Yearly summary</h3>
              <p className="mt-1 text-xs text-[#655d51]">Invest amounts aggregated by calendar year.</p>
              <div className={`${investingTableScrollWrap} mt-4`}>
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-[#f4efe4] text-xs text-[#7f7668]">
                    <tr>
                      <th className="px-3 py-2 font-medium">Year</th>
                      <th className="px-3 py-2 font-medium">Sum of invest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyTable.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-3 py-4 text-center text-xs text-[#8f8676]">
                          No dated refills yet.
                        </td>
                      </tr>
                    ) : (
                      yearlyTable.map((row) => (
                        <tr key={row.year} className="border-t border-black/5">
                          <td className="px-3 py-2 font-medium text-[#1f1c17]">{row.year}</td>
                          <td className="px-3 py-2 tabular-nums text-[#3b352d]">
                            {row.sum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-xl border border-black/5 bg-[#faf8f2] p-3">
                <label className="block text-xs font-medium text-[#6f675b]">Operating expenses override, $</label>
                <p className="mt-0.5 text-[11px] text-[#8f8676]">
                  Leave empty to use the sum of commission per refill. Set a total (e.g. all-in fees) to match your
                  spreadsheet.
                </p>
                <input
                  value={operatingExpensesUsd}
                  onChange={(e) => setOperatingExpensesUsd(e.target.value)}
                  placeholder={`e.g. 643.79 (default from commissions: ${totalCommission.toFixed(2)})`}
                  className={`${inputBaseClasses()} mt-2`}
                />
              </div>
            </article>
            <YearlyInvestmentsBarChart
              title="Amount of investments by year"
              data={yearlyBars}
              yAxisLabel="Sum of invest"
              xAxisLabel="Year"
            />
          </div>
        ) : null}
      </section>

      <section className={investingSubsectionStack}>
        <InvestingSubsectionHeader
          title="Refills"
          isOpen={isRefillsOpen}
          onToggle={() => setRefillsOpen((v) => !v)}
        />
        {isRefillsOpen ? (
          <>
            <p className="text-xs text-[#655d51]">
              Date (DD.MM.YYYY or YYYY-MM-DD), invest amount, commission in USD.
            </p>
            <div className={investingTableScrollWrap}>
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead className="bg-[#f4efe4] text-xs text-[#7f7668]">
                  <tr>
                    <th className="px-2 py-2 font-medium">Date</th>
                    <th className="px-2 py-2 font-medium">Invest</th>
                    <th className="px-2 py-2 font-medium">Commission, $</th>
                    <th className="px-2 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {refills.map((row) => (
                    <tr key={row.id} className="border-t border-black/5 align-top">
                      <td className="px-2 py-2">
                        <input
                          value={row.date}
                          onChange={(e) => updateRefill(row.id, { date: e.target.value })}
                          className={inputBaseClasses()}
                          placeholder="DD.MM.YYYY"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={row.amount}
                          onChange={(e) => updateRefill(row.id, { amount: e.target.value })}
                          className={inputBaseClasses()}
                          placeholder="0"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={row.commission}
                          onChange={(e) => updateRefill(row.id, { commission: e.target.value })}
                          className={inputBaseClasses()}
                          placeholder="0"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => deleteRefill(row.id)}
                          className={investingToolbarBtn}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-black/15 bg-[#f6f3ea] font-medium">
                    <td className="px-2 py-2 text-[#1f1c17]">Total</td>
                    <td className="px-2 py-2 tabular-nums text-[#1f1c17]">
                      {totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-2 tabular-nums text-[#1f1c17]">
                      {totalCommission.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-2" />
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
