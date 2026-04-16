"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { InvestingHolding } from "@/data/mock-jarvis";
import { useAuth } from "./auth-store";
import { apiFetch } from "@/lib/api";
import { formatUsd, parseUsd } from "@/features/investing/format";

export type InvestingCapitalEntry = {
  id: string;
  date: string;
  deposit: string;
  total_value: string;
  roi_percent: string;
  one_year_percent: string;
};

type InvestingStore = {
  holdings: InvestingHolding[];
  holdingsMeta: { source: "server" | "default"; updatedAt: string | null };
  capitalEntries: InvestingCapitalEntry[];
  capitalEntriesMeta: { updatedAt: string | null };
  isCapitalEntriesLoading: boolean;
  isCapitalEntriesDirty: boolean;
  isCapitalEntriesSaving: boolean;
  metrics: { divYieldPercent: string; beta: string };
  isMetricsLoading: boolean;
  isHoldingsLoading: boolean;
  isHoldingsDirty: boolean;
  isHoldingsSaving: boolean;
  updateHolding: (id: string, patch: Partial<InvestingHolding>) => void;
  addHolding: () => void;
  deleteHolding: (id: string) => void;
  reset: () => void;
  updateCapitalEntry: (id: string, patch: Partial<InvestingCapitalEntry>) => void;
  addCapitalEntry: () => void;
  deleteCapitalEntry: (id: string) => void;
  refreshCapitalEntries: () => Promise<void>;
  saveCapitalEntries: () => Promise<void>;
  refreshHoldings: () => Promise<void>;
  saveHoldings: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  updateMetrics: (patch: Partial<{ divYieldPercent: string; beta: string }>) => Promise<void>;
};

const InvestingContext = createContext<InvestingStore | null>(null);

function createEmptyHolding(): InvestingHolding {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
  return {
    id,
    ticker: "NEW",
    name: "New holding",
    industry: "—",
    targetWeight: "0.0%",
    currentWeight: "0.0%",
    shares: 0,
    avgBuyPrice: "$0.00",
    marketPrice: "$0.00",
    marketValue: "$0.00",
    pnl: "$0.00",
    trend: "up",
  };
}

function computePnl(h: InvestingHolding): string {
  const cost = (h.shares ?? 0) * parseUsd(h.avgBuyPrice ?? "$0");
  const value = parseUsd(h.marketValue ?? "$0");
  const pnl = value - cost;
  const formatted = formatUsd(pnl);
  return pnl > 0 ? `+${formatted}` : formatted;
}

function normalizeHoldings(rows: InvestingHolding[]): InvestingHolding[] {
  const totalValue = rows.reduce((sum, row) => sum + parseUsd(row.marketValue ?? "$0"), 0);
  return rows.map((row) => {
    const value = parseUsd(row.marketValue ?? "$0");
    const currentWeight = totalValue > 0 ? `${((value / totalValue) * 100).toFixed(1)}%` : "0.0%";
    const base: InvestingHolding = { ...row, currentWeight };
    return { ...base, pnl: computePnl(base) };
  });
}

export function InvestingProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [holdings, setHoldings] = useState<InvestingHolding[]>([]);
  const [holdingsMeta, setHoldingsMeta] = useState<{
    source: "server" | "default";
    updatedAt: string | null;
  }>({ source: "default", updatedAt: null });
  const [isHoldingsLoading, setHoldingsLoading] = useState(false);
  const [isHoldingsDirty, setHoldingsDirty] = useState(false);
  const [isHoldingsSaving, setHoldingsSaving] = useState(false);
  const [capitalEntries, setCapitalEntries] = useState<InvestingCapitalEntry[]>([]);
  const [capitalEntriesMeta, setCapitalEntriesMeta] = useState<{ updatedAt: string | null }>({
    updatedAt: null,
  });
  const [isCapitalEntriesLoading, setCapitalEntriesLoading] = useState(false);
  const [isCapitalEntriesDirty, setCapitalEntriesDirty] = useState(false);
  const [isCapitalEntriesSaving, setCapitalEntriesSaving] = useState(false);

  const [metrics, setMetricsState] = useState<{ divYieldPercent: string; beta: string }>(() => {
    return { divYieldPercent: "—", beta: "—" };
  });
  const [isMetricsLoading, setMetricsLoading] = useState(false);

  async function refreshHoldings() {
    if (!token) {
      setHoldings([]);
      setHoldingsMeta({ source: "default", updatedAt: null });
      setHoldingsDirty(false);
      return;
    }
    setHoldingsLoading(true);
    try {
      const res = await apiFetch<{ holdings: InvestingHolding[]; updated_at: string | null }>(
        "/investing/holdings",
        { token },
      );
      if (res.holdings.length > 0) {
        setHoldings(normalizeHoldings(res.holdings));
        setHoldingsMeta({ source: "server", updatedAt: res.updated_at });
      } else {
        setHoldings([]);
        setHoldingsMeta({ source: "server", updatedAt: res.updated_at });
      }
      setHoldingsDirty(false);
    } finally {
      setHoldingsLoading(false);
    }
  }

  async function refreshCapitalEntries() {
    if (!token) {
      setCapitalEntries([]);
      setCapitalEntriesMeta({ updatedAt: null });
      setCapitalEntriesDirty(false);
      return;
    }
    setCapitalEntriesLoading(true);
    try {
      const res = await apiFetch<{ entries: InvestingCapitalEntry[]; updated_at: string | null }>(
        "/investing/capital-entries",
        { token },
      );
      setCapitalEntries(res.entries);
      setCapitalEntriesMeta({ updatedAt: res.updated_at ?? null });
      setCapitalEntriesDirty(false);
    } finally {
      setCapitalEntriesLoading(false);
    }
  }

  async function saveCapitalEntries() {
    if (!token || !isCapitalEntriesDirty) return;
    setCapitalEntriesSaving(true);
    try {
      const payload = capitalEntries.map((e) => ({
        id: e.id,
        date: e.date,
        deposit: e.deposit,
        total_value: e.total_value,
      }));
      const res = await apiFetch<{ entries: InvestingCapitalEntry[]; updated_at: string | null }>(
        "/investing/capital-entries",
        {
          token,
          method: "PUT",
          body: JSON.stringify({ entries: payload }),
        },
      );
      setCapitalEntries(res.entries);
      setCapitalEntriesMeta({ updatedAt: res.updated_at ?? null });
      setCapitalEntriesDirty(false);
    } finally {
      setCapitalEntriesSaving(false);
    }
  }

  async function saveHoldings() {
    if (!token) return;
    if (!isHoldingsDirty) return;
    setHoldingsSaving(true);
    try {
      const res = await apiFetch<{ updated_at: string | null }>("/investing/holdings", {
        token,
        method: "PUT",
        body: JSON.stringify({ holdings }),
      });
      setHoldingsMeta({ source: "server", updatedAt: res.updated_at ?? null });
      setHoldingsDirty(false);
    } finally {
      setHoldingsSaving(false);
    }
  }

  async function refreshMetrics() {
    if (!token) {
      setMetricsState({ divYieldPercent: "—", beta: "—" });
      return;
    }
    setMetricsLoading(true);
    try {
      const res = await apiFetch<{ div_yield_percent: string; beta: string }>("/investing/metrics", {
        token,
      });
      setMetricsState({ divYieldPercent: res.div_yield_percent, beta: res.beta });
    } finally {
      setMetricsLoading(false);
    }
  }

  async function updateMetrics(patch: Partial<{ divYieldPercent: string; beta: string }>) {
    if (!token) return;
    const payload = {
      div_yield_percent: patch.divYieldPercent,
      beta: patch.beta,
    };
    const res = await apiFetch<{ div_yield_percent: string; beta: string }>("/investing/metrics", {
      token,
      method: "PUT",
      body: JSON.stringify(payload),
    });
    setMetricsState({ divYieldPercent: res.div_yield_percent, beta: res.beta });
  }

  useEffect(() => {
    void refreshHoldings().catch(() => {});
    void refreshCapitalEntries().catch(() => {});
    void refreshMetrics().catch(() => {});
  }, [token]);

  const store = useMemo<InvestingStore>(() => {
    return {
      holdings,
      holdingsMeta,
      capitalEntries,
      capitalEntriesMeta,
      isCapitalEntriesLoading,
      isCapitalEntriesDirty,
      isCapitalEntriesSaving,
      metrics,
      isMetricsLoading,
      isHoldingsLoading,
      isHoldingsDirty,
      isHoldingsSaving,
      updateHolding: (id, patch) => {
        setHoldingsDirty(true);
        setHoldings((prev) => normalizeHoldings(prev.map((h) => (h.id === id ? { ...h, ...patch } : h))));
      },
      addHolding: () => {
        setHoldingsDirty(true);
        setHoldings((prev) => normalizeHoldings([createEmptyHolding(), ...prev]));
      },
      deleteHolding: (id) => {
        setHoldingsDirty(true);
        setHoldings((prev) => normalizeHoldings(prev.filter((h) => h.id !== id)));
      },
      reset: () => {
        setHoldingsDirty(true);
        setHoldings([]);
      },
      updateCapitalEntry: (id, patch) => {
        setCapitalEntriesDirty(true);
        setCapitalEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
      },
      addCapitalEntry: () => {
        setCapitalEntriesDirty(true);
        setCapitalEntries((prev) => [
          ...prev,
          {
            id:
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${Date.now()}`,
            date: "",
            deposit: "$0.00",
            total_value: "$0.00",
            roi_percent: "0.00%",
            one_year_percent: "0.00%",
          },
        ]);
      },
      deleteCapitalEntry: (id) => {
        setCapitalEntriesDirty(true);
        setCapitalEntries((prev) => prev.filter((e) => e.id !== id));
      },
      refreshCapitalEntries,
      saveCapitalEntries,
      refreshHoldings,
      saveHoldings,
      refreshMetrics,
      updateMetrics,
    };
  }, [
    holdings,
    holdingsMeta,
    capitalEntries,
    capitalEntriesMeta,
    isCapitalEntriesLoading,
    isCapitalEntriesDirty,
    isCapitalEntriesSaving,
    metrics,
    isMetricsLoading,
    isHoldingsLoading,
    isHoldingsDirty,
    isHoldingsSaving,
  ]);

  return <InvestingContext.Provider value={store}>{children}</InvestingContext.Provider>;
}

export function useInvesting() {
  const ctx = useContext(InvestingContext);
  if (!ctx) throw new Error("useInvesting must be used within InvestingProvider");
  return ctx;
}

