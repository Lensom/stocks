"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useInvesting } from "@/state/investing-store";
import { formatPercent, formatUsd, parseUsd } from "./format";

function StatCell({
  label,
  value,
  tone = "default",
  right,
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative";
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-black/10 px-4 py-3">
      <span className="text-xs font-semibold text-[#1f1c17]">{label}</span>
      {right ?? (
        <span
          className={[
            "text-xs font-semibold tabular-nums",
            tone === "positive"
              ? "text-emerald-700"
              : tone === "negative"
                ? "text-rose-700"
                : "text-[#1f1c17]",
          ].join(" ")}
        >
          {value}
        </span>
      )}
    </div>
  );
}

export function PortfolioSummary() {
  const { holdings, metrics, isMetricsLoading, updateMetrics } = useInvesting();

  const summary = useMemo(() => {
    const value = holdings.reduce((a, h) => a + parseUsd(h.marketValue), 0);
    const cost = holdings.reduce((a, h) => a + h.shares * parseUsd(h.avgBuyPrice), 0);
    const gain = value - cost;
    const gainPct = cost > 0 ? (gain / cost) * 100 : 0;

    return { value, cost, gain, gainPct };
  }, [holdings]);

  const gainTone = summary.gain >= 0 ? "positive" : "negative";

  const [isEditing, setEditing] = useState(false);
  const [draftDivYield, setDraftDivYield] = useState(metrics.divYieldPercent);
  const [draftBeta, setDraftBeta] = useState(metrics.beta);
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) return;
    setDraftDivYield(metrics.divYieldPercent);
    setDraftBeta(metrics.beta);
  }, [metrics.divYieldPercent, metrics.beta, isEditing]);

  function onCancel() {
    setDraftDivYield(metrics.divYieldPercent);
    setDraftBeta(metrics.beta);
    setEditing(false);
  }

  async function onSave() {
    setSaving(true);
    try {
      await updateMetrics({
        divYieldPercent: draftDivYield.trim() || "—",
        beta: draftBeta.trim() || "—",
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function inputClassName() {
    return "h-8 w-[110px] rounded-lg border border-black/10 bg-white px-2 text-xs font-semibold tabular-nums text-[#1f1c17] outline-none focus:border-black/20";
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8f8676]">
            Dashboard
          </p>
          <p className="mt-1 text-sm font-semibold text-[#1f1c17]">Portfolio summary</p>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                disabled={isSaving}
                onClick={onSave}
                className={[
                  "rounded-full bg-[#1f1c17] px-3 py-1.5 text-[11px] font-medium text-[#f8f4eb] transition hover:bg-[#2c2923]",
                  isSaving ? "opacity-60" : "",
                ].join(" ")}
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={onCancel}
                className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-medium text-[#3b352d] hover:bg-[#faf8f2]"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-medium text-[#3b352d] hover:bg-[#faf8f2]"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2">
        <div className="border-black/10 md:border-r">
          <StatCell label="Portfolio Value, $" value={formatUsd(summary.value)} />
          <StatCell label="Portfolio Cost, $" value={formatUsd(summary.cost)} />
          <StatCell label="Gain/Loss, $" value={formatUsd(summary.gain)} tone={gainTone} />
        </div>

        <div>
          <StatCell
            label="Gain/Loss by total paid %"
            value={formatPercent(summary.gainPct)}
            tone={gainTone}
          />
          <StatCell
            label="Div Yield, %"
            value={metrics.divYieldPercent}
            right={
              isEditing ? (
                <input
                  value={draftDivYield}
                  onChange={(e) => setDraftDivYield(e.target.value)}
                  className={inputClassName()}
                  placeholder="e.g. 2.5%"
                />
              ) : (
                <span className="text-xs font-semibold tabular-nums text-[#1f1c17]">
                  {isMetricsLoading ? "…" : metrics.divYieldPercent}
                </span>
              )
            }
          />
          <StatCell
            label="Beta"
            value={metrics.beta}
            right={
              isEditing ? (
                <input
                  value={draftBeta}
                  onChange={(e) => setDraftBeta(e.target.value)}
                  className={inputClassName()}
                  placeholder="e.g. 1.16"
                />
              ) : (
                <span className="text-xs font-semibold tabular-nums text-[#1f1c17]">
                  {isMetricsLoading ? "…" : metrics.beta}
                </span>
              )
            }
          />
        </div>
      </div>
    </section>
  );
}

