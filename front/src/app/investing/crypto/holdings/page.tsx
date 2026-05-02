"use client";

import { useMemo, useState } from "react";
import { parseCryptoAmount } from "@/features/investing/crypto-format";
import {
  investingMetaBadge,
  investingPrimarySaveActive,
  investingPrimarySaveDisabled,
  investingSubsectionStack,
  investingTableScrollWrap,
  investingToolbarBtn,
} from "@/features/investing/ui/investing-classes";
import { InvestingSubsectionHeader } from "@/features/investing/ui/investing-subsection-header";
import { useCrypto } from "@/state/crypto-store";
import { cryptoInputClasses } from "../_inputs";

function dayChangeClass(s: string | undefined) {
  const raw = String(s ?? "").trim().replace("%", "");
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return "text-[#6f675b]";
  if (n > 0) return "text-emerald-700";
  if (n < 0) return "text-rose-700";
  return "text-[#6f675b]";
}

const th = "px-2 py-2.5 align-middle text-xs font-medium text-[#7f7668]";
const tdMid = "px-2 py-2 align-middle";
const inputCenter = `${cryptoInputClasses()} text-center tabular-nums`;
const inputLeft = `${cryptoInputClasses()} text-left`;

export default function CryptoHoldingsPage() {
  const {
    holdings,
    cryptoMeta,
    isCryptoLoading,
    isCryptoSaving,
    isCryptoDirty,
    updateHolding,
    addHolding,
    deleteHolding,
    saveCrypto,
    refreshCrypto,
  } = useCrypto();

  const [tableOpen, setTableOpen] = useState(true);

  const totalValue = useMemo(() => {
    return holdings.reduce((a, h) => a + parseCryptoAmount(String(h.valueUsd ?? "")), 0);
  }, [holdings]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={investingMetaBadge}>
          {cryptoMeta.updatedAt
            ? `Synced ${new Date(cryptoMeta.updatedAt).toLocaleString()}`
            : "Not synced"}
        </span>
        <button
          type="button"
          onClick={() => void refreshCrypto()}
          disabled={isCryptoLoading}
          className={`${investingToolbarBtn} disabled:opacity-50`}
        >
          {isCryptoLoading ? "…" : "Refresh prices"}
        </button>
        <button type="button" onClick={addHolding} className={investingToolbarBtn}>
          Add asset
        </button>
        <button
          type="button"
          onClick={() => void saveCrypto()}
          disabled={!isCryptoDirty || isCryptoSaving || isCryptoLoading}
          className={[
            "transition",
            !isCryptoDirty || isCryptoSaving || isCryptoLoading
              ? investingPrimarySaveDisabled
              : investingPrimarySaveActive,
          ].join(" ")}
        >
          {isCryptoSaving ? "Saving…" : "Save"}
        </button>
      </div>

      <section className={investingSubsectionStack}>
        <InvestingSubsectionHeader
          title="Current portfolio"
          isOpen={tableOpen}
          onToggle={() => setTableOpen((v) => !v)}
        />
        {tableOpen ? (
          <div className={investingTableScrollWrap}>
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead className="bg-[#f4efe4]">
                <tr>
                  <th className={`${th} text-left`}>Ticker</th>
                  <th className={`${th} text-left`}>Name</th>
                  <th className={`${th} text-center`}>Quantity</th>
                  <th className={`${th} text-center`}>Price, $</th>
                  <th className={`${th} text-center`}>Day %</th>
                  <th className={`${th} text-center`}>Value, $</th>
                  <th className={`${th} text-center`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((row) => (
                  <tr key={row.id} className="border-t border-black/5">
                    <td className={tdMid}>
                      <input
                        value={row.symbol}
                        onChange={(e) => updateHolding(row.id, { symbol: e.target.value.toUpperCase() })}
                        className={`${inputLeft} uppercase`}
                        placeholder="BTC"
                      />
                    </td>
                    <td className={tdMid}>
                      <input
                        value={row.name}
                        onChange={(e) => updateHolding(row.id, { name: e.target.value })}
                        className={inputLeft}
                        placeholder="Bitcoin"
                      />
                    </td>
                    <td className={tdMid}>
                      <input
                        value={row.quantity}
                        onChange={(e) => updateHolding(row.id, { quantity: e.target.value })}
                        className={inputCenter}
                        placeholder="0.00233"
                        inputMode="decimal"
                      />
                    </td>
                    <td className={tdMid}>
                      <div className="rounded-lg border border-black/10 bg-[#faf8f2] px-2 py-1.5 text-center text-sm tabular-nums text-[#2f2922]">
                        {row.quoteUsd ?? "—"}
                      </div>
                    </td>
                    <td
                      className={`${tdMid} text-center text-sm font-semibold tabular-nums ${dayChangeClass(row.dayChangePct)}`}
                    >
                      {row.dayChangePct ?? "—"}
                    </td>
                    <td className={tdMid}>
                      <div className="rounded-lg border border-black/10 bg-[#faf8f2] px-2 py-1.5 text-center text-sm font-medium tabular-nums text-[#2f2922]">
                        {row.valueUsd ?? "—"}
                      </div>
                    </td>
                    <td className={`${tdMid} text-center`}>
                      <button type="button" onClick={() => deleteHolding(row.id)} className={investingToolbarBtn}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {holdings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center align-middle text-xs text-[#8f8676]">
                      No rows. Add BTC, ETH — quotes use the -USD pair automatically.
                    </td>
                  </tr>
                ) : null}
                <tr className="border-t-2 border-black/15 bg-[#f6f3ea] font-medium">
                  <td className={`${tdMid} text-left text-[#1f1c17]`} colSpan={5}>
                    Total
                  </td>
                  <td className={`${tdMid} text-center tabular-nums text-[#1f1c17]`}>
                    {totalValue > 0
                      ? `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td className={tdMid} />
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
