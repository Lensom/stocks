"use client";

import { apiFetch } from "@/lib/api";
import { formatCryptoUsd, parseCryptoAmount, yahooCryptoPair } from "@/features/investing/crypto-format";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./auth-store";

export type CryptoHoldingRow = {
  id: string;
  symbol: string;
  name: string;
  quantity: string;
  /** Filled from quotes; not saved */
  quoteUsd?: string;
  dayChangePct?: string;
  valueUsd?: string;
};

/** Persisted holding row (no live quote fields). */
export type CryptoHoldingCore = Omit<CryptoHoldingRow, "quoteUsd" | "dayChangePct" | "valueUsd">;

export type CryptoPurchaseRow = {
  id: string;
  date: string;
  btc_usd: string;
  btc_price: string;
  eth_usd: string;
  eth_price: string;
};

export type CryptoRefillRow = {
  id: string;
  date: string;
  uah: string;
  usd: string;
};

export type CryptoRules = {
  btc_percent: string;
  eth_percent: string;
  btc_note: string;
  eth_note: string;
};

type CryptoApiRow = {
  holdings: Omit<CryptoHoldingRow, "quoteUsd" | "dayChangePct" | "valueUsd">[];
  purchase_rows: CryptoPurchaseRow[];
  refill_rows: CryptoRefillRow[];
  rules: CryptoRules;
  updated_at: string | null;
};

function stripQuoteFields(h: CryptoHoldingRow | CryptoHoldingCore): CryptoHoldingCore {
  return { id: h.id, symbol: h.symbol, name: h.name, quantity: h.quantity };
}

function applyQuotesToHoldings(
  rows: CryptoHoldingCore[],
  prices: Record<string, number>,
  dayPct: Record<string, number>,
): CryptoHoldingRow[] {
  return rows.map((row) => {
    const pair = yahooCryptoPair(row.symbol);
    if (!pair) return { ...row, quoteUsd: undefined, dayChangePct: undefined, valueUsd: undefined };
    const px = prices[pair];
    const qty = parseCryptoAmount(row.quantity);
    const d = dayPct[pair];
    const quoteUsd = typeof px === "number" && Number.isFinite(px) ? formatCryptoUsd(px) : undefined;
    const dayChangePct =
      typeof d === "number" && Number.isFinite(d) ? `${d > 0 ? "+" : ""}${d.toFixed(2)}%` : undefined;
    const valueUsd =
      typeof px === "number" && Number.isFinite(px) && qty > 0 ? formatCryptoUsd(px * qty) : undefined;
    return { ...row, quoteUsd, dayChangePct, valueUsd };
  });
}

type CryptoStore = {
  holdings: CryptoHoldingRow[];
  purchaseRows: CryptoPurchaseRow[];
  refillRows: CryptoRefillRow[];
  rules: CryptoRules;
  cryptoMeta: { updatedAt: string | null };
  isCryptoLoading: boolean;
  isCryptoSaving: boolean;
  isCryptoDirty: boolean;
  updateHolding: (id: string, patch: Partial<CryptoHoldingRow>) => void;
  addHolding: () => void;
  deleteHolding: (id: string) => void;
  updatePurchase: (id: string, patch: Partial<CryptoPurchaseRow>) => void;
  addPurchase: () => void;
  deletePurchase: (id: string) => void;
  updateRefill: (id: string, patch: Partial<CryptoRefillRow>) => void;
  addRefill: () => void;
  deleteRefill: (id: string) => void;
  setRules: (patch: Partial<CryptoRules>) => void;
  refreshCrypto: () => Promise<void>;
  saveCrypto: () => Promise<void>;
};

const CryptoContext = createContext<CryptoStore | null>(null);

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
}

function mapApiToState(res: CryptoApiRow): {
  holdingsCore: CryptoHoldingCore[];
  purchaseRows: CryptoPurchaseRow[];
  refillRows: CryptoRefillRow[];
  rules: CryptoRules;
} {
  return {
    holdingsCore: res.holdings.map((h) => ({ ...h })),
    purchaseRows: res.purchase_rows.map((r) => ({ ...r })),
    refillRows: res.refill_rows.map((r) => ({ ...r })),
    rules: { ...res.rules },
  };
}

export function CryptoProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [holdingsCore, setHoldingsCore] = useState<CryptoHoldingCore[]>([]);
  const [quotePrices, setQuotePrices] = useState<Record<string, number>>({});
  const [quoteDayPct, setQuoteDayPct] = useState<Record<string, number>>({});
  const [purchaseRows, setPurchaseRows] = useState<CryptoPurchaseRow[]>([]);
  const [refillRows, setRefillRows] = useState<CryptoRefillRow[]>([]);
  const [rules, setRulesState] = useState<CryptoRules>({
    btc_percent: "70",
    eth_percent: "30",
    btc_note: "",
    eth_note: "",
  });
  const [cryptoMeta, setCryptoMeta] = useState<{ updatedAt: string | null }>({ updatedAt: null });
  const [isCryptoLoading, setCryptoLoading] = useState(false);
  const [isCryptoSaving, setCryptoSaving] = useState(false);
  const [isCryptoDirty, setCryptoDirty] = useState(false);

  const quoteFetchKey = useMemo(() => {
    const pairs = holdingsCore
      .map((h) => yahooCryptoPair(h.symbol))
      .filter((p) => p.length > 0);
    return Array.from(new Set(pairs)).sort().join(",");
  }, [holdingsCore]);

  useEffect(() => {
    if (!token) {
      setQuotePrices({});
      setQuoteDayPct({});
      return;
    }
    if (!quoteFetchKey) {
      setQuotePrices({});
      setQuoteDayPct({});
      return;
    }
    let cancelled = false;
    const tid = window.setTimeout(() => {
      void (async () => {
        try {
          const quoteRes = await apiFetch<{
            prices: Record<string, number>;
            day_change_percent?: Record<string, number>;
          }>(`/investing/quotes?tickers=${encodeURIComponent(quoteFetchKey)}`, { token });
          if (cancelled) return;
          setQuotePrices(quoteRes.prices ?? {});
          setQuoteDayPct(quoteRes.day_change_percent ?? {});
        } catch {
          if (cancelled) return;
        }
      })();
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(tid);
    };
  }, [token, quoteFetchKey]);

  const holdings = useMemo(
    () => applyQuotesToHoldings(holdingsCore, quotePrices, quoteDayPct),
    [holdingsCore, quotePrices, quoteDayPct],
  );

  const refreshCrypto = useCallback(async () => {
    if (!token) {
      setHoldingsCore([]);
      setQuotePrices({});
      setQuoteDayPct({});
      setPurchaseRows([]);
      setRefillRows([]);
      setRulesState({ btc_percent: "70", eth_percent: "30", btc_note: "", eth_note: "" });
      setCryptoMeta({ updatedAt: null });
      setCryptoDirty(false);
      return;
    }
    setCryptoLoading(true);
    try {
      const res = await apiFetch<CryptoApiRow>("/investing/crypto", { token });
      const mapped = mapApiToState(res);
      setPurchaseRows(mapped.purchaseRows);
      setRefillRows(mapped.refillRows);
      setRulesState(mapped.rules);
      setCryptoMeta({ updatedAt: res.updated_at ?? null });
      setCryptoDirty(false);

      // Fetch quotes before committing holdings so we never paint a frame with rows but empty prices
      // (React may flush setHoldingsCore alone across an await boundary).
      const pairs = Array.from(
        new Set(mapped.holdingsCore.map((h) => yahooCryptoPair(h.symbol)).filter((p) => p.length > 0)),
      );
      let nextPrices: Record<string, number> = {};
      let nextDay: Record<string, number> = {};
      if (pairs.length > 0) {
        try {
          const quoteRes = await apiFetch<{
            prices: Record<string, number>;
            day_change_percent?: Record<string, number>;
          }>(`/investing/quotes?tickers=${encodeURIComponent(pairs.join(","))}`, { token });
          nextPrices = quoteRes.prices ?? {};
          nextDay = quoteRes.day_change_percent ?? {};
        } catch {
          /* debounced effect may retry */
        }
      }
      setHoldingsCore(mapped.holdingsCore);
      setQuotePrices(nextPrices);
      setQuoteDayPct(nextDay);
    } finally {
      setCryptoLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshCrypto();
  }, [refreshCrypto]);

  const saveCrypto = useCallback(async () => {
    if (!token || !isCryptoDirty) return;
    setCryptoSaving(true);
    try {
      const payload = {
        holdings: holdingsCore,
        purchase_rows: purchaseRows,
        refill_rows: refillRows,
        rules,
      };
      const res = await apiFetch<CryptoApiRow>("/investing/crypto", {
        token,
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const mapped = mapApiToState(res);
      setRulesState(mapped.rules);
      setPurchaseRows(mapped.purchaseRows);
      setRefillRows(mapped.refillRows);
      setCryptoMeta({ updatedAt: res.updated_at ?? null });
      setCryptoDirty(false);

      const pairs = Array.from(
        new Set(mapped.holdingsCore.map((h) => yahooCryptoPair(h.symbol)).filter((p) => p.length > 0)),
      );
      let nextPrices: Record<string, number> = {};
      let nextDay: Record<string, number> = {};
      if (pairs.length > 0) {
        try {
          const quoteRes = await apiFetch<{
            prices: Record<string, number>;
            day_change_percent?: Record<string, number>;
          }>(`/investing/quotes?tickers=${encodeURIComponent(pairs.join(","))}`, { token });
          nextPrices = quoteRes.prices ?? {};
          nextDay = quoteRes.day_change_percent ?? {};
        } catch {
          /* debounced effect may retry */
        }
      }
      setHoldingsCore(mapped.holdingsCore);
      setQuotePrices(nextPrices);
      setQuoteDayPct(nextDay);
    } finally {
      setCryptoSaving(false);
    }
  }, [token, isCryptoDirty, holdingsCore, purchaseRows, refillRows, rules]);

  const store = useMemo<CryptoStore>(
    () => ({
      holdings,
      purchaseRows,
      refillRows,
      rules,
      cryptoMeta,
      isCryptoLoading,
      isCryptoSaving,
      isCryptoDirty,
      updateHolding: (id, patch) => {
        setCryptoDirty(true);
        setHoldingsCore((prev) =>
          prev.map((h) => (h.id === id ? stripQuoteFields({ ...h, ...patch } as CryptoHoldingRow) : h)),
        );
      },
      addHolding: () => {
        setCryptoDirty(true);
        setHoldingsCore((prev) => [
          ...prev,
          { id: newId(), symbol: "", name: "", quantity: "" },
        ]);
      },
      deleteHolding: (id) => {
        setCryptoDirty(true);
        setHoldingsCore((prev) => prev.filter((h) => h.id !== id));
      },
      updatePurchase: (id, patch) => {
        setCryptoDirty(true);
        setPurchaseRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      },
      addPurchase: () => {
        setCryptoDirty(true);
        setPurchaseRows((prev) => [
          ...prev,
          { id: newId(), date: "", btc_usd: "", btc_price: "", eth_usd: "", eth_price: "" },
        ]);
      },
      deletePurchase: (id) => {
        setCryptoDirty(true);
        setPurchaseRows((prev) => prev.filter((r) => r.id !== id));
      },
      updateRefill: (id, patch) => {
        setCryptoDirty(true);
        setRefillRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      },
      addRefill: () => {
        setCryptoDirty(true);
        setRefillRows((prev) => [...prev, { id: newId(), date: "", uah: "", usd: "" }]);
      },
      deleteRefill: (id) => {
        setCryptoDirty(true);
        setRefillRows((prev) => prev.filter((r) => r.id !== id));
      },
      setRules: (patch) => {
        setCryptoDirty(true);
        setRulesState((prev) => ({ ...prev, ...patch }));
      },
      refreshCrypto,
      saveCrypto,
    }),
    [
      holdings,
      purchaseRows,
      refillRows,
      rules,
      cryptoMeta,
      isCryptoLoading,
      isCryptoSaving,
      isCryptoDirty,
      refreshCrypto,
      saveCrypto,
    ],
  );

  return <CryptoContext.Provider value={store}>{children}</CryptoContext.Provider>;
}

export function useCrypto() {
  const ctx = useContext(CryptoContext);
  if (!ctx) throw new Error("useCrypto must be used within CryptoProvider");
  return ctx;
}
