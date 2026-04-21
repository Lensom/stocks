"use client";

import Link from "next/link";
import { useInvesting } from "@/state/investing-store";

function inputBaseClasses() {
  return "w-full rounded-lg border border-black/10 bg-white/90 px-2 py-1 text-sm text-[#2f2922] outline-none placeholder:text-[#b0a79a] focus:border-black/20 focus:bg-white";
}

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
  } = useInvesting();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8f8676]">Investing</p>
          <h1 className="mt-1.5 text-3xl font-semibold text-[#1f1c17]">Picking</h1>
          <p className="mt-1.5 text-sm text-[#655d51]">
            Personal buy strategy table (per user): entry zones, goals and reports.
          </p>
        </div>
        <Link
          href="/investing"
          className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-medium text-[#3b352d]"
        >
          Back
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs text-[#6f675b]">
          {pickingMeta.updatedAt ? `Synced ${new Date(pickingMeta.updatedAt).toLocaleString()}` : "Not synced"}
        </span>
        <button
          type="button"
          onClick={addPickingRow}
          className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-medium text-[#3b352d] hover:bg-[#faf8f2]"
        >
          Add row
        </button>
        <button
          type="button"
          onClick={() => void savePicking()}
          disabled={!isPickingDirty || isPickingSaving || isPickingLoading}
          className={[
            "rounded-full px-3.5 py-1.5 text-xs font-medium transition",
            !isPickingDirty || isPickingSaving || isPickingLoading
              ? "cursor-not-allowed bg-black/10 text-[#6f675b]"
              : "bg-[#1f1c17] text-[#f8f4eb] hover:bg-[#2c2923]",
          ].join(" ")}
        >
          {isPickingSaving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white/90 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
        <table className="w-full min-w-[1700px] border-collapse text-left text-sm">
          <thead className="bg-[#f4efe4] text-xs text-[#7f7668]">
            <tr>
              <th className="px-2 py-2 font-medium">Name</th>
              <th className="px-2 py-2 font-medium">Ticker</th>
              <th className="px-2 py-2 font-medium">Industry</th>
              <th className="px-2 py-2 font-medium">P/E</th>
              <th className="px-2 py-2 font-medium">EPS</th>
              <th className="px-2 py-2 font-medium">Beta</th>
              <th className="px-2 py-2 font-medium">Div yield</th>
              <th className="px-2 py-2 font-medium">Current price</th>
              <th className="px-2 py-2 font-medium">Strong buy until</th>
              <th className="px-2 py-2 font-medium">May buy until</th>
              <th className="px-2 py-2 font-medium">Buy right now?</th>
              <th className="px-2 py-2 font-medium">Price Goal, 1y</th>
              <th className="px-2 py-2 font-medium">Price Goal, 5y</th>
              <th className="px-2 py-2 font-medium">Reports</th>
              <th className="px-2 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pickingRows.map((row) => (
              <tr key={row.id} className="border-t border-black/5 align-top">
                {(
                  [
                    "name",
                    "ticker",
                    "industry",
                    "pe",
                    "eps",
                    "beta",
                    "div_yield",
                    "current_price",
                    "strong_buy_until",
                    "may_buy_until",
                    "buy_right_now",
                    "price_goal_1y",
                    "price_goal_5y",
                    "reports",
                  ] as const
                ).map((key) => (
                  <td key={key} className="px-2 py-2">
                    <input
                      value={row[key] ?? ""}
                      onChange={(e) => updatePickingRow(row.id, { [key]: e.target.value })}
                      className={inputBaseClasses()}
                    />
                  </td>
                ))}
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => deletePickingRow(row.id)}
                    className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[#3b352d] hover:bg-[#faf8f2]"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {pickingRows.length === 0 ? (
              <tr>
                <td colSpan={15} className="px-3 py-4 text-center text-xs text-[#8f8676]">
                  No picking rows yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

