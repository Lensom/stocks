import { marketMovers } from "@/data/mock-stock-data";

export default function Home() {
  return (
    <div className="space-y-7">
      <section className="rounded-[1.75rem] border border-black/5 bg-[#f1ece1] p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] md:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8f8676]">
          Product Overview
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-[#1f1c17] md:text-4xl">
          Meet your thinking partner for stock research.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#655d51]">
          Explore markets, organize ideas, and track opportunities in one clean
          workspace. This is a design-first prototype powered by mock data.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <button className="rounded-full bg-[#1f1c17] px-4 py-2 text-xs font-medium text-[#f8f4eb]">
            Start exploring
          </button>
          <button className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-medium text-[#3b352d]">
            View watchlist
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {marketMovers.map((stock) => (
          <article
            key={stock.symbol}
            className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#938979]">
                  {stock.symbol}
                </p>
                <h2 className="mt-1.5 text-base font-semibold text-[#1f1c17]">
                  {stock.company}
                </h2>
              </div>
              <p
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  stock.trend === "up"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {stock.change}
              </p>
            </div>
            <p className="mt-4 text-2xl font-semibold text-[#1f1c17]">{stock.price}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
