"use client";

import { investingToolbarBtnSm } from "./investing-classes";

export function InvestingSubsectionHeader({
  title,
  isOpen,
  onToggle,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-[#1f1c17]">{title}</h2>
      <button type="button" onClick={onToggle} className={investingToolbarBtnSm}>
        {isOpen ? "Hide" : "Show"}
      </button>
    </div>
  );
}
