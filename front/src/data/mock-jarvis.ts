export type JarvisCategory = {
  slug: string;
  title: string;
  description: string;
  statusLabel?: string;
};

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
  marketValue: string;
  pnl: string;
  trend: "up" | "down";
};

export const categories: JarvisCategory[] = [
  {
    slug: "investing",
    title: "Investing",
    description: "Portfolio, watchlists, goals and notes in one place.",
    statusLabel: "MVP",
  },
  {
    slug: "habits",
    title: "Habits",
    description: "Daily tracking, streaks and routines (mock placeholder).",
    statusLabel: "Soon",
  },
  {
    slug: "finances",
    title: "Finances",
    description: "Budgeting, spending and planning (mock placeholder).",
    statusLabel: "Soon",
  },
];

export const investingNotes = [
  {
    title: "Rebalance rule",
    tag: "Process",
    updatedAt: "Today",
    body: "Target weights: 40/30/20/10. Rebalance when drift exceeds 2%.",
  },
  {
    title: "Buy list (next adds)",
    tag: "Ideas",
    updatedAt: "Yesterday",
    body: "Consider adding VOO/QQQ on pullbacks. Keep cash buffer for volatility.",
  },
  {
    title: "Risk check",
    tag: "Review",
    updatedAt: "Last week",
    body: "Limit single-stock exposure. Prefer broad ETFs for core allocation.",
  },
];
