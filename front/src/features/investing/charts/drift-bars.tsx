"use client";

type DriftRow = {
  label: string;
  target: number;
  current: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function DriftBars({ rows }: { rows: DriftRow[] }) {
  const maxDrift = Math.max(1, ...rows.map((r) => Math.abs(r.current - r.target)));

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const drift = r.current - r.target;
        const driftAbs = Math.abs(drift);
        const driftPct = clamp((driftAbs / maxDrift) * 100, 8, 100);

        return (
          <div key={r.label} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate text-sm font-semibold text-[#1f1c17]">{r.label}</p>
              <p className="shrink-0 text-xs text-[#6f675b]">
                Target {r.target.toFixed(1)}% · Current {r.current.toFixed(1)}% ·{" "}
                <span className={drift >= 0 ? "text-emerald-700" : "text-rose-700"}>
                  Drift = Current - Target = {drift >= 0 ? "+" : "-"}
                  {driftAbs.toFixed(1)}%
                </span>
              </p>
            </div>

            <div className="relative h-3 w-full overflow-hidden rounded-full bg-black/5">
              <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-black/60" />
              {drift >= 0 ? (
                <div
                  className="absolute inset-y-0 left-1/2 rounded-r-full bg-emerald-400"
                  style={{ width: `${driftPct / 2}%` }}
                />
              ) : (
                <div
                  className="absolute inset-y-0 right-1/2 rounded-l-full bg-rose-400"
                  style={{ width: `${driftPct / 2}%` }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

