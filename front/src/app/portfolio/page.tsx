import { portfolio } from "@/data/mock-stock-data";

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8f8676]">
          Performance
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold text-[#1f1c17]">Portfolio</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
          <p className="text-xs text-[#7f7668]">Total value</p>
          <p className="mt-1.5 text-xl font-semibold text-[#1f1c17]">$7,739.31</p>
        </article>
        <article className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
          <p className="text-xs text-[#7f7668]">Daily change</p>
          <p className="mt-1.5 text-xl font-semibold text-emerald-600">+$143.80</p>
        </article>
        <article className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
          <p className="text-xs text-[#7f7668]">Positions</p>
          <p className="mt-1.5 text-xl font-semibold text-[#1f1c17]">{portfolio.length}</p>
        </article>
      </div>

      <section className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
        <h2 className="text-xl font-semibold text-[#1f1c17]">Portfolio Holdings</h2>
        <div className="mt-3.5 space-y-2.5">
          {portfolio.map((item) => (
            <article
              key={item.symbol}
              className="flex flex-col gap-2.5 rounded-xl border border-black/5 bg-[#faf8f2] p-3.5 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-[#1f1c17]">
                  {item.symbol} - {item.company}
                </p>
                <p className="text-xs text-[#6f675b]">
                  {item.shares} shares · Avg {item.avgPrice}
                </p>
              </div>
              <div className="flex gap-5 text-xs">
                <p className="text-[#6f675b]">
                  Value <span className="font-semibold text-[#1f1c17]">{item.marketValue}</span>
                </p>
                <p className={item.trend === "up" ? "text-emerald-600" : "text-rose-600"}>
                  {item.pnl}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
