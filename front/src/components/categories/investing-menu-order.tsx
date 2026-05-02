"use client";

import { useEffect, useMemo, useState } from "react";
import { useCategories } from "@/state/categories-store";

export function InvestingMenuOrder() {
  const { categories, subcategoriesByCategoryId, refreshSubcategories, reorderSubcategories } =
    useCategories();
  const investing = useMemo(() => categories.find((c) => c.slug === "investing"), [categories]);
  const subs = investing ? (subcategoriesByCategoryId[investing.id] ?? []) : [];
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (investing?.id) void refreshSubcategories(investing.id);
  }, [investing?.id, refreshSubcategories]);

  async function move(index: number, delta: number) {
    if (!investing) return;
    const j = index + delta;
    if (j < 0 || j >= subs.length) return;
    const next = [...subs];
    const tmp = next[index]!;
    next[index] = next[j]!;
    next[j] = tmp;
    setBusy(true);
    setError(null);
    try {
      await reorderSubcategories(
        investing.id,
        next.map((s) => s.id),
      );
    } catch {
      setError("Could not save order");
      await refreshSubcategories(investing.id);
    } finally {
      setBusy(false);
    }
  }

  if (!investing) return null;

  return (
    <section className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
      <h2 className="text-sm font-semibold text-[#1f1c17]">Investing page order</h2>
      <p className="mt-1 text-xs text-[#655d51]">
        Subpages appear in the sidebar in this order. Use arrows to move items up or down.
      </p>
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
      <ul className="mt-4 space-y-2">
        {subs.length === 0 ? (
          <li className="text-xs text-[#8f8676]">Loading subcategories…</li>
        ) : (
          subs.map((sub, index) => (
            <li
              key={sub.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-black/5 bg-[#faf8f2] px-3 py-2"
            >
              <span className="text-sm font-medium text-[#1f1c17]">{sub.name}</span>
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={busy || index === 0}
                  onClick={() => void move(index, -1)}
                  className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-medium text-[#3b352d] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={busy || index === subs.length - 1}
                  onClick={() => void move(index, 1)}
                  className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-medium text-[#3b352d] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Move down"
                >
                  ↓
                </button>
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
