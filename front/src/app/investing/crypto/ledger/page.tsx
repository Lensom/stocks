"use client";

import { useState } from "react";
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

const th = "px-2 py-2.5 align-middle text-xs font-medium text-[#7f7668]";
const tdMid = "px-2 py-2 align-middle";
const inputNum = `${cryptoInputClasses()} text-center tabular-nums`;
const inputDate = `${cryptoInputClasses()} text-center`;

export default function CryptoLedgerPage() {
  const {
    purchaseRows,
    refillRows,
    cryptoMeta,
    isCryptoLoading,
    isCryptoSaving,
    isCryptoDirty,
    updatePurchase,
    addPurchase,
    deletePurchase,
    updateRefill,
    addRefill,
    deleteRefill,
    saveCrypto,
    refreshCrypto,
  } = useCrypto();

  const [purchOpen, setPurchOpen] = useState(true);
  const [refillOpen, setRefillOpen] = useState(true);

  return (
    <div className="space-y-6">
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
          {isCryptoLoading ? "…" : "Refresh"}
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
          title="Funding: UAH → USD"
          isOpen={refillOpen}
          onToggle={() => setRefillOpen((v) => !v)}
        />
        {refillOpen ? (
          <>
            <p className="text-xs text-[#655d51]">
              Fiat in: date, UAH amount, USD equivalent (as in your sheet).
            </p>
            <div className={investingTableScrollWrap}>
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead className="bg-[#f4efe4]">
                  <tr>
                    <th className={`${th} text-center`}>Date</th>
                    <th className={`${th} text-center`}>UAH</th>
                    <th className={`${th} text-center`}>USD</th>
                    <th className={`${th} text-center`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {refillRows.map((row) => (
                    <tr key={row.id} className="border-t border-black/5">
                      <td className={tdMid}>
                        <input
                          value={row.date}
                          onChange={(e) => updateRefill(row.id, { date: e.target.value })}
                          className={inputDate}
                          placeholder="DD.MM.YYYY"
                        />
                      </td>
                      <td className={tdMid}>
                        <input
                          value={row.uah}
                          onChange={(e) => updateRefill(row.id, { uah: e.target.value })}
                          className={inputNum}
                          placeholder="5340"
                          inputMode="decimal"
                        />
                      </td>
                      <td className={tdMid}>
                        <input
                          value={row.usd}
                          onChange={(e) => updateRefill(row.id, { usd: e.target.value })}
                          className={inputNum}
                          placeholder="125.08"
                          inputMode="decimal"
                        />
                      </td>
                      <td className={`${tdMid} text-center`}>
                        <button type="button" onClick={() => deleteRefill(row.id)} className={investingToolbarBtn}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={addRefill} className={investingToolbarBtn}>
              Add funding row
            </button>
          </>
        ) : null}
      </section>

      <section className={investingSubsectionStack}>
        <InvestingSubsectionHeader
          title="BTC / ETH purchases"
          isOpen={purchOpen}
          onToggle={() => setPurchOpen((v) => !v)}
        />
        {purchOpen ? (
          <>
            <p className="text-xs text-[#655d51]">
              Per date: USD spent on BTC/ETH and execution price. Leave cells empty if only one leg (same as the
              spreadsheet).
            </p>
            <div className={investingTableScrollWrap}>
              <table className="w-full min-w-[920px] border-collapse text-sm">
                <thead className="bg-[#f4efe4]">
                  <tr>
                    <th className={`${th} text-center`}>Date</th>
                    <th className={`${th} text-center`}>BTC, $</th>
                    <th className={`${th} text-center`}>BTC price</th>
                    <th className={`${th} text-center`}>ETH, $</th>
                    <th className={`${th} text-center`}>ETH price</th>
                    <th className={`${th} text-center`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseRows.map((row) => (
                    <tr key={row.id} className="border-t border-black/5">
                      <td className={tdMid}>
                        <input
                          value={row.date}
                          onChange={(e) => updatePurchase(row.id, { date: e.target.value })}
                          className={inputDate}
                          placeholder="DD.MM.YYYY"
                        />
                      </td>
                      <td className={tdMid}>
                        <input
                          value={row.btc_usd}
                          onChange={(e) => updatePurchase(row.id, { btc_usd: e.target.value })}
                          className={inputNum}
                          inputMode="decimal"
                        />
                      </td>
                      <td className={tdMid}>
                        <input
                          value={row.btc_price}
                          onChange={(e) => updatePurchase(row.id, { btc_price: e.target.value })}
                          className={inputNum}
                          inputMode="decimal"
                        />
                      </td>
                      <td className={tdMid}>
                        <input
                          value={row.eth_usd}
                          onChange={(e) => updatePurchase(row.id, { eth_usd: e.target.value })}
                          className={inputNum}
                          inputMode="decimal"
                        />
                      </td>
                      <td className={tdMid}>
                        <input
                          value={row.eth_price}
                          onChange={(e) => updatePurchase(row.id, { eth_price: e.target.value })}
                          className={inputNum}
                          inputMode="decimal"
                        />
                      </td>
                      <td className={`${tdMid} text-center`}>
                        <button type="button" onClick={() => deletePurchase(row.id)} className={investingToolbarBtn}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={addPurchase} className={investingToolbarBtn}>
              Add purchase row
            </button>
          </>
        ) : null}
      </section>
    </div>
  );
}
