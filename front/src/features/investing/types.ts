export type InvestingHolding = {
  id: string;
  ticker: string;
  name: string;
  industry: string;
  targetWeight: string;
  currentWeight: string;
  shares: number;
  avgBuyPrice: string;
  marketPrice: string;
  /** From quotes API when refreshed; not persisted. */
  dayChangePercent?: string;
  marketValue: string;
  pnl: string;
  trend: "up" | "down";
};
