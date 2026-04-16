"use client";

import { useMemo } from "react";

function formatCompactUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function Sparkline({
  values,
  width = 260,
  height = 56,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  const { points, min, max } = useMemo(() => {
    const safe = values.length ? values : [0];
    const mn = Math.min(...safe);
    const mx = Math.max(...safe);
    const range = mx - mn || 1;
    const pts = safe
      .map((v, i) => {
        const x = (i / Math.max(1, safe.length - 1)) * (width - 8) + 4;
        const y = height - 4 - ((v - mn) / range) * (height - 8);
        return `${x},${y}`;
      })
      .join(" ");
    return { points: pts, min: mn, max: mx };
  }, [values, width, height]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect x="0" y="0" width={width} height={height} rx="12" fill="#faf8f2" stroke="rgba(0,0,0,0.06)" />
      <polyline points={points} fill="none" stroke="#1f1c17" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <text x="10" y="18" fontSize="10" fill="#8f8676">
        min {formatCompactUsd(min)} · max {formatCompactUsd(max)}
      </text>
    </svg>
  );
}

