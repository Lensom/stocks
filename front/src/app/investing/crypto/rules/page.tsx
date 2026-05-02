"use client";

import {
  investingMetaBadge,
  investingPrimarySaveActive,
  investingPrimarySaveDisabled,
  investingToolbarBtn,
} from "@/features/investing/ui/investing-classes";
import { formatCryptoUsd, parseCryptoAmount } from "@/features/investing/crypto-format";
import { useCrypto } from "@/state/crypto-store";
import { cryptoInputClasses } from "../_inputs";
import { useMemo, useState } from "react";

export default function CryptoRulesPage() {
  const {
    rules,
    setRules,
    cryptoMeta,
    isCryptoLoading,
    isCryptoSaving,
    isCryptoDirty,
    saveCrypto,
    refreshCrypto,
  } = useCrypto();

  const [previewUsd, setPreviewUsd] = useState("100");

  const btcPct = parseCryptoAmount(rules.btc_percent);
  const ethPct = parseCryptoAmount(rules.eth_percent);
  const sumPct = btcPct + ethPct;

  const preview = useMemo(() => {
    const base = parseCryptoAmount(previewUsd);
    if (base <= 0) return { btc: 0, eth: 0 };
    const b = Number.isFinite(btcPct) ? btcPct : 70;
    const e = Number.isFinite(ethPct) ? ethPct : 30;
    const t = b + e || 100;
    return { btc: (base * b) / t, eth: (base * e) / t };
  }, [previewUsd, btcPct, ethPct]);

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

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
          <h2 className="text-sm font-semibold text-[#1f1c17]">New deposit split</h2>
          <p className="mt-1 text-xs text-[#655d51]">
            Percentages for the next top-up. They don’t have to add to 100% — the preview scales proportionally.
          </p>
          {Math.abs(sumPct - 100) > 0.01 && sumPct > 0 ? (
            <p className="mt-2 text-xs text-amber-700">
              Total {sumPct.toFixed(0)}% — preview uses ratio {btcPct}:{ethPct}.
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[#6f675b]">
              BTC, %
              <input
                value={rules.btc_percent}
                onChange={(e) => setRules({ btc_percent: e.target.value })}
                className={`${cryptoInputClasses()} mt-1 text-center tabular-nums`}
                inputMode="decimal"
              />
            </label>
            <label className="block text-xs font-medium text-[#6f675b]">
              ETH, %
              <input
                value={rules.eth_percent}
                onChange={(e) => setRules({ eth_percent: e.target.value })}
                className={`${cryptoInputClasses()} mt-1 text-center tabular-nums`}
                inputMode="decimal"
              />
            </label>
          </div>

          <label className="mt-4 block text-xs font-medium text-[#6f675b]">
            BTC note (free text)
            <textarea
              value={rules.btc_note}
              onChange={(e) => setRules({ btc_note: e.target.value })}
              rows={2}
              className={`${cryptoInputClasses()} mt-1 min-h-[3.5rem] resize-y`}
              placeholder="e.g. $87.50 goes to BTC"
            />
          </label>
          <label className="mt-3 block text-xs font-medium text-[#6f675b]">
            ETH note
            <textarea
              value={rules.eth_note}
              onChange={(e) => setRules({ eth_note: e.target.value })}
              rows={2}
              className={`${cryptoInputClasses()} mt-1 min-h-[3.5rem] resize-y`}
              placeholder="e.g. $37.50 goes to ETH"
            />
          </label>
        </article>

        <article className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
          <h2 className="text-sm font-semibold text-[#1f1c17]">Split preview</h2>
          <p className="mt-1 text-xs text-[#655d51]">Hypothetical deposit size in USD.</p>
          <input
            value={previewUsd}
            onChange={(e) => setPreviewUsd(e.target.value)}
            className={`${cryptoInputClasses()} mt-3 max-w-[200px] text-center tabular-nums`}
            inputMode="decimal"
          />
          <div className="mt-4 space-y-3 rounded-xl border border-black/5 bg-[#faf8f2] p-4">
            <p className="text-center text-sm tabular-nums text-[#3b352d]">
              <span className="font-semibold text-[#1f1c17]">{rules.btc_percent}%</span> BTC ≈{" "}
              {formatCryptoUsd(preview.btc)}
            </p>
            <p className="text-center text-sm tabular-nums text-[#3b352d]">
              <span className="font-semibold text-[#1f1c17]">{rules.eth_percent}%</span> ETH ≈{" "}
              {formatCryptoUsd(preview.eth)}
            </p>
          </div>
          {(rules.btc_note || rules.eth_note) && (
            <div className="mt-4 space-y-2 text-xs text-[#655d51]">
              {rules.btc_note ? (
                <p>
                  <span className="font-medium text-[#3b352d]">BTC: </span>
                  {rules.btc_note}
                </p>
              ) : null}
              {rules.eth_note ? (
                <p>
                  <span className="font-medium text-[#3b352d]">ETH: </span>
                  {rules.eth_note}
                </p>
              ) : null}
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
