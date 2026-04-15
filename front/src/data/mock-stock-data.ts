export type MarketMover = {
  symbol: string;
  company: string;
  price: string;
  change: string;
  trend: "up" | "down";
};

export type NewsItem = {
  title: string;
  source: string;
  time: string;
  summary: string;
};

export type PortfolioHolding = {
  symbol: string;
  company: string;
  shares: number;
  avgPrice: string;
  marketValue: string;
  pnl: string;
  trend: "up" | "down";
};

export const marketMovers: MarketMover[] = [
  {
    symbol: "NVDA",
    company: "NVIDIA Corp.",
    price: "$932.14",
    change: "+3.42%",
    trend: "up",
  },
  {
    symbol: "AAPL",
    company: "Apple Inc.",
    price: "$208.71",
    change: "+1.18%",
    trend: "up",
  },
  {
    symbol: "TSLA",
    company: "Tesla Inc.",
    price: "$171.55",
    change: "-2.06%",
    trend: "down",
  },
  {
    symbol: "MSFT",
    company: "Microsoft Corp.",
    price: "$420.89",
    change: "+0.74%",
    trend: "up",
  },
];

export const watchlist: MarketMover[] = [
  {
    symbol: "AMD",
    company: "Advanced Micro Devices",
    price: "$173.30",
    change: "+2.12%",
    trend: "up",
  },
  {
    symbol: "AMZN",
    company: "Amazon.com Inc.",
    price: "$186.04",
    change: "-0.64%",
    trend: "down",
  },
  {
    symbol: "META",
    company: "Meta Platforms",
    price: "$501.77",
    change: "+1.03%",
    trend: "up",
  },
];

export const portfolio: PortfolioHolding[] = [
  {
    symbol: "MSFT",
    company: "Microsoft Corp.",
    shares: 9,
    avgPrice: "$376.20",
    marketValue: "$3,788.01",
    pnl: "+$402.21",
    trend: "up",
  },
  {
    symbol: "AAPL",
    company: "Apple Inc.",
    shares: 14,
    avgPrice: "$192.10",
    marketValue: "$2,922.00",
    pnl: "+$232.60",
    trend: "up",
  },
  {
    symbol: "TSLA",
    company: "Tesla Inc.",
    shares: 6,
    avgPrice: "$203.40",
    marketValue: "$1,029.30",
    pnl: "-$191.10",
    trend: "down",
  },
];

export const marketNews: NewsItem[] = [
  {
    title: "Chipmakers lead the rally as AI demand accelerates",
    source: "Market Pulse",
    time: "2h ago",
    summary:
      "Semiconductor stocks continue to outperform as hyperscalers increase infrastructure spending.",
  },
  {
    title: "Mega caps steady after CPI print meets expectations",
    source: "Daily Finance",
    time: "4h ago",
    summary:
      "Investors rotate into quality names while volatility cools in the broader market.",
  },
  {
    title: "Energy drags while software names recover",
    source: "Street Wire",
    time: "6h ago",
    summary:
      "Sector divergence remains elevated as traders position for next quarter guidance.",
  },
];
