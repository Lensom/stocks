"use client";

import { useMemo, useState } from "react";
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

export default function InvestingActivitiesPage() {
  const {
    activities,
    activitiesSummary,
    activitiesMeta,
    isActivitiesLoading,
    isActivitiesSaving,
    isActivitiesDirty,
    updateActivity,
    addActivity,
    deleteActivity,
    saveActivities,
  } = useInvesting();

  const purchases = useMemo(
    () => activities.filter((a) => a.type === "buy"),
    [activities],
  );
  const sales = useMemo(
    () => activities.filter((a) => a.type === "sell"),
    [activities],
  );
  const [isYearlyOpen, setYearlyOpen] = useState(true);
  const [isPurchasesOpen, setPurchasesOpen] = useState(true);
  const [isSalesOpen, setSalesOpen] = useState(true);

  function renderTable(rows: typeof activities, kind: "buy" | "sell") {
    return (
      <div className={investingTableScrollWrap}>
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-[#f4efe4] text-xs text-[#7f7668]">
            <tr>
              <th className="w-[220px] px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Ticker</th>
              <th className="w-[170px] px-3 py-2 font-medium">Category</th>
              <th className="w-[72px] px-3 py-2 font-medium">Count</th>
              <th className="w-[130px] px-3 py-2 font-medium">Price</th>
              <th className="w-[62px] px-3 py-2 font-medium">Currency</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Amount (USD)</th>
              <th className="w-[96px] px-3 py-2 font-medium">Gains/Losses</th>
              <th className="w-[96px] px-3 py-2 font-medium">Commission</th>
              <th className="w-[68px] px-3 py-2 font-medium">FX to USD</th>
              <th className="w-[150px] px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-black/5 align-top">
                <td className="px-2 py-2">
                  <input
                    value={row.name}
                    onChange={(e) =>
                      updateActivity(row.id, { name: e.target.value })
                    }
                    className={inputBaseClasses()}
                    placeholder="Company"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    value={row.ticker}
                    onChange={(e) =>
                      updateActivity(row.id, {
                        ticker: e.target.value.toUpperCase(),
                      })
                    }
                    className={inputBaseClasses()}
                    placeholder="AAPL"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    value={row.category}
                    onChange={(e) =>
                      updateActivity(row.id, { category: e.target.value })
                    }
                    className={inputBaseClasses()}
                    placeholder="ETF / Banks / ..."
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    value={String(row.count)}
                    onChange={(e) =>
                      updateActivity(row.id, {
                        count: Number(e.target.value) || 0,
                      })
                    }
                    className={inputBaseClasses()}
                    inputMode="numeric"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    value={row.price}
                    onChange={(e) =>
                      updateActivity(row.id, { price: e.target.value })
                    }
                    className={inputBaseClasses()}
                    inputMode="decimal"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    value={row.currency}
                    onChange={(e) =>
                      updateActivity(row.id, {
                        currency: e.target.value.toUpperCase(),
                      })
                    }
                    className={inputBaseClasses()}
                    placeholder="USD"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    value={row.amount}
                    onChange={(e) =>
                      updateActivity(row.id, { amount: e.target.value })
                    }
                    className={inputBaseClasses()}
                    inputMode="decimal"
                  />
                </td>
                <td className="px-2 py-2">
                  <div className="w-full rounded-lg border border-black/10 bg-[#faf8f2] px-2 py-1.5 text-sm tabular-nums text-[#2f2922]">
                    {row.amount_usd ?? "0.00"}
                  </div>
                </td>
                <td className="px-2 py-2">
                  <input
                    value={row.gains_losses}
                    onChange={(e) =>
                      updateActivity(row.id, { gains_losses: e.target.value })
                    }
                    className={inputBaseClasses()}
                    inputMode="decimal"
                    placeholder="0"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    value={row.commission}
                    onChange={(e) =>
                      updateActivity(row.id, { commission: e.target.value })
                    }
                    className={inputBaseClasses()}
                    inputMode="decimal"
                  />
                </td>
                <td className="px-2 py-2">
                  <div className="w-full rounded-lg border border-black/10 bg-[#faf8f2] px-2 py-1.5 text-sm tabular-nums text-[#2f2922]">
                    {(Number(row.fx_rate_to_usd ?? "1") || 1).toFixed(1)}
                  </div>
                </td>
                <td className="px-2 py-2">
                  <input
                    value={row.date}
                    onChange={(e) =>
                      updateActivity(row.id, { date: e.target.value })
                    }
                    className={inputBaseClasses()}
                    placeholder="dd.mm.yyyy"
                  />
                </td>
                <td className="px-2 py-2">
                  <button type="button" onClick={() => deleteActivity(row.id)} className={investingToolbarBtn}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={13}
                  className="px-3 py-4 text-center text-xs text-[#8f8676]"
                >
                  No {kind === "buy" ? "purchases" : "sales"} yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={investingPageStack}>
      <p className="text-sm text-[#655d51]">
        Purchases and sales history with yearly totals from your database.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className={investingMetaBadge}>
          {activitiesMeta.updatedAt
            ? `Synced ${new Date(activitiesMeta.updatedAt).toLocaleString()}`
            : "Not synced"}
        </span>
        <button type="button" onClick={() => addActivity("buy")} className={investingToolbarBtn}>
          Add purchase
        </button>
        <button type="button" onClick={() => addActivity("sell")} className={investingToolbarBtn}>
          Add sale
        </button>
        <button
          type="button"
          onClick={() => void saveActivities()}
          disabled={!isActivitiesDirty || isActivitiesSaving || isActivitiesLoading}
          className={[
            "transition",
            !isActivitiesDirty || isActivitiesSaving || isActivitiesLoading
              ? investingPrimarySaveDisabled
              : investingPrimarySaveActive,
          ].join(" ")}
        >
          {isActivitiesSaving ? "Saving..." : "Save"}
        </button>
      </div>

      <section className={investingSubsectionStack}>
        <InvestingSubsectionHeader
          title="Yearly totals"
          isOpen={isYearlyOpen}
          onToggle={() => setYearlyOpen((v) => !v)}
        />
        {isYearlyOpen ? (
          <div className={investingTableScrollWrap}>
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead className="bg-[#f4efe4] text-xs text-[#7f7668]">
              <tr>
                <th className="px-3 py-2 font-medium">Year</th>
                <th className="px-3 py-2 font-medium">
                  Purchases amount (USD)
                </th>
                <th className="px-3 py-2 font-medium">
                  Purchases commission (USD)
                </th>
                <th className="px-3 py-2 font-medium">Sales amount (USD)</th>
                <th className="px-3 py-2 font-medium">
                  Sales commission (USD)
                </th>
                <th className="px-3 py-2 font-medium">Realized P/L (USD)</th>
                <th className="px-3 py-2 font-medium">Net cash flow (USD)</th>
              </tr>
            </thead>
            <tbody>
              {activitiesSummary.map((row) => (
                <tr key={row.year} className="border-t border-black/5">
                  <td className="px-3 py-2 font-semibold text-[#2f2922]">
                    {row.year}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {row.purchases_amount}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {row.purchases_commission}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{row.sales_amount}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {row.sales_commission}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{row.sales_pnl}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {row.net_cash_flow}
                  </td>
                </tr>
              ))}
              {activitiesSummary.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-4 text-center text-xs text-[#8f8676]"
                  >
                    No yearly data yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          </div>
        ) : null}
      </section>

      <section className={investingSubsectionStack}>
        <InvestingSubsectionHeader
          title="Purchases"
          isOpen={isPurchasesOpen}
          onToggle={() => setPurchasesOpen((v) => !v)}
        />
        {isPurchasesOpen ? renderTable(purchases, "buy") : null}
      </section>

      <section className={investingSubsectionStack}>
        <InvestingSubsectionHeader
          title="Sales"
          isOpen={isSalesOpen}
          onToggle={() => setSalesOpen((v) => !v)}
        />
        {isSalesOpen ? renderTable(sales, "sell") : null}
      </section>
    </div>
  );
}
