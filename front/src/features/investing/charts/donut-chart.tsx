"use client";

import { useMemo, useState } from "react";

type Slice = {
  label: string;
  value: number;
  color: string;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function DonutChart({
  slices,
  size = 220,
  title = "Allocation",
  onChartClick,
  onSliceHover,
}: {
  slices: Slice[];
  size?: number;
  title?: string;
  onChartClick?: () => void;
  onSliceHover?: (slice: Slice | null) => void;
}) {
  const { total, normalized, segments } = useMemo(() => {
    const t = slices.reduce((a, s) => a + Math.max(0, s.value), 0);
    const norm = slices
      .map((s) => ({ ...s, value: Math.max(0, s.value) }))
      .filter((s) => s.value > 0);

    const segs = norm.reduce<{ cum: number; segs: Array<Slice & { start: number; end: number }> }>(
      (acc, s) => {
        const start = t === 0 ? 0 : (acc.cum / t) * 360;
        const nextCum = acc.cum + s.value;
        const end = t === 0 ? 0 : (nextCum / t) * 360;
        return {
          cum: nextCum,
          segs: [...acc.segs, { ...s, start, end }],
        };
      },
      { cum: 0, segs: [] },
    ).segs;

    return { total: t, normalized: norm, segments: segs };
  }, [slices]);

  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * 0.72;
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  function setHover(label: string | null) {
    setHoveredLabel(label);
    if (!onSliceHover) return;
    const slice = label ? normalized.find((s) => s.label === label) ?? null : null;
    onSliceHover(slice);
  }

  return (
    <div className="flex items-center gap-5">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        onClick={onChartClick}
        className={onChartClick ? "cursor-pointer" : ""}
      >
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={18} />
        {segments.map((s) => (
          <path
            key={s.label}
            d={arcPath(cx, cy, r, s.start, s.end)}
            fill="none"
            stroke={s.color}
            strokeWidth={hoveredLabel === s.label ? 22 : 18}
            strokeLinecap="round"
            onMouseEnter={() => setHover(s.label)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        <circle cx={cx} cy={cy} r={r - 18} fill="#faf8f2" stroke="rgba(0,0,0,0.04)" />
      </svg>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8f8676]">
          {title}
        </p>
        <ul className="mt-2 space-y-1">
          {normalized.map((s) => (
            <li key={s.label} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: s.color }}
                  onMouseEnter={() => setHover(s.label)}
                  onMouseLeave={() => setHover(null)}
                />
                <span className="truncate text-[#2f2922]">{s.label}</span>
              </span>
              <span className="shrink-0 text-xs font-medium text-[#6f675b]">
                {((s.value / total) * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

