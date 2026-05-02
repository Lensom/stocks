"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatCryptoUsd, parseCryptoAmount } from "@/features/investing/crypto-format";
import {
  investingMetaBadge,
  investingPrimarySaveActive,
  investingPrimarySaveDisabled,
  investingTableScrollWrap,
  investingToolbarBtn,
} from "@/features/investing/ui/investing-classes";
import { useCrypto } from "@/state/crypto-store";

const thBase = "px-3 py-2.5 align-middle text-xs font-medium";
const tdAsset = "px-3 py-2.5 align-middle text-left text-sm font-medium text-[#1f1c17]";
const tdNum = "px-3 py-2.5 align-middle text-center text-sm tabular-nums text-[#3b352d]";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className="rounded-2xl border border-black/5 bg-white/90 p-4 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
      <p className="text-xs text-[#7f7668]">{label}</p>
      <p className="mt-1.5 text-lg font-semibold tabular-nums text-[#1f1c17]">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-[#8f8676]">{hint}</p> : null}
    </article>
  );
}

function avgBuy(
  rows: { btc_usd: string; btc_price: string; eth_usd: string; eth_price: string }[],
  which: "btc" | "eth",
): string {
  const uk = which === "btc" ? "btc_usd" : "eth_usd";
  const pk = which === "btc" ? "btc_price" : "eth_price";
  let coins = 0;
  let spent = 0;
  for (const r of rows) {
    const usd = parseCryptoAmount(r[uk]);
    const price = parseCryptoAmount(r[pk]);
    if (usd <= 0 || price <= 0) continue;
    coins += usd / price;
    spent += usd;
  }
  if (coins <= 0) return "—";
  return formatCryptoUsd(spent / coins);
}

export default function CryptoOverviewPage() {
  const {
    holdings,
    purchaseRows,
    refillRows,
    rules,
    cryptoMeta,
    isCryptoLoading,
    isCryptoSaving,
    isCryptoDirty,
    saveCrypto,
    refreshCrypto,
  } = useCrypto();

  const totalMarket = useMemo(() => {
    let s = 0;
    for (const h of holdings) {
      const v = parseCryptoAmount(String(h.valueUsd ?? ""));
      if (v > 0) s += v;
    }
    if (s <= 0) {
      for (const h of holdings) {
        const q = parseCryptoAmount(h.quantity);
        const p = parseCryptoAmount(String(h.quoteUsd ?? ""));
        if (q > 0 && p > 0) s += q * p;
      }
    }
    return s;
  }, [holdings]);

  const totalRefillUsd = useMemo(() => {
    return refillRows.reduce((a, r) => a + parseCryptoAmount(r.usd), 0);
  }, [refillRows]);

  const btcAvg = useMemo(() => avgBuy(purchaseRows, "btc"), [purchaseRows]);
  const ethAvg = useMemo(() => avgBuy(purchaseRows, "eth"), [purchaseRows]);

  const btcRule = parseCryptoAmount(rules.btc_percent);
  const ethRule = parseCryptoAmount(rules.eth_percent);

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
          {isCryptoLoading ? "Loading…" : "Refresh data & prices"}
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
          {isCryptoSaving ? "Saving…" : "Save all"}
        </button>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Portfolio value"
          value={formatCryptoUsd(totalMarket)}
          hint="Live quote × quantity."
        />
        <StatCard
          label="Total funded (USD)"
          value={formatCryptoUsd(totalRefillUsd)}
          hint="Sum of USD in the funding table (separate from coin marks)."
        />
        <StatCard
          label="Rules"
          value={`${rules.btc_percent}% / ${rules.eth_percent}%`}
          hint="BTC / ETH share of each new deposit"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
          <h2 className="text-sm font-semibold text-[#1f1c17]">Average buy (from history)</h2>
          <p className="mt-1 text-xs text-[#655d51]">
            Volume-weighted where USD spent and asset price are both filled in.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-black/5 bg-[#faf8f2] p-3 text-center">
              <dt className="text-xs text-[#7f7668]">BTC</dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-[#1f1c17]">{btcAvg}</dd>
            </div>
            <div className="rounded-xl border border-black/5 bg-[#faf8f2] p-3 text-center">
              <dt className="text-xs text-[#7f7668]">ETH</dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-[#1f1c17]">{ethAvg}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
          <h2 className="text-sm font-semibold text-[#1f1c17]">Rules quick preview</h2>
          <p className="mt-1 text-xs text-[#655d51]">
            Example deposit $100 (change split on the Rules tab).
          </p>
          <div className="mt-4 space-y-2 rounded-xl border border-black/5 bg-[#faf8f2] p-4 text-sm text-[#3b352d]">
            <p className="text-center tabular-nums">
              <span className="font-medium text-[#1f1c17]">{rules.btc_percent}%</span> BTC ≈{" "}
              {formatCryptoUsd(100 * (Number.isFinite(btcRule) ? btcRule / 100 : 0.7))}
            </p>
            <p className="text-center tabular-nums">
              <span className="font-medium text-[#1f1c17]">{rules.eth_percent}%</span> ETH ≈{" "}
              {formatCryptoUsd(100 * (Number.isFinite(ethRule) ? ethRule / 100 : 0.3))}
            </p>
          </div>
          <Link href="/investing/crypto/ledger" className={`${investingToolbarBtn} mt-4 inline-flex`}>
            Edit history
          </Link>
        </article>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[#1f1c17]">Positions snapshot</h2>
        <p className="mt-1 text-xs text-[#655d51]">Read-only; edit on Portfolio.</p>
        <div className={`${investingTableScrollWrap} mt-3`}>
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead className="bg-[#f4efe4] text-[#7f7668]">
              <tr>
                <th className={`${thBase} text-left`}>Asset</th>
                <th className={`${thBase} text-center`}>Qty</th>
                <th className={`${thBase} text-center`}>Price</th>
                <th className={`${thBase} text-center`}>Day %</th>
                <th className={`${thBase} text-center`}>Value</th>
              </tr>
            </thead>
            <tbody>
              {holdings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center align-middle text-xs text-[#8f8676]">
                    No positions yet — add them on Portfolio.
                  </td>
                </tr>
              ) : (
                holdings.map((h) => (
                  <tr key={h.id} className="border-t border-black/5">
                    <td className={tdAsset}>
                      {h.symbol || "—"}
                      {h.name ? (
                        <span className="mt-0.5 block text-xs font-normal text-[#6f675b]">{h.name}</span>
                      ) : null}
                    </td>
                    <td className={tdNum}>{h.quantity || "—"}</td>
                    <td className={tdNum}>{h.quoteUsd ?? "—"}</td>
                    <td className={tdNum}>{h.dayChangePct ?? "—"}</td>
                    <td className={tdNum}>{h.valueUsd ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
