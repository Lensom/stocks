import { watchlist } from "@/data/mock-stock-data";

export default function WatchlistPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8f8676]">
          Saved ideas
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold text-[#1f1c17]">Watchlist</h1>
        <p className="mt-1.5 text-sm text-[#655d51]">Saved tickers with static mock prices.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white/90 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
        <table className="w-full border-collapse text-left">
          <thead className="bg-[#f4efe4] text-xs text-[#7f7668]">
            <tr>
              <th className="px-4 py-2.5 font-medium">Symbol</th>
              <th className="px-4 py-2.5 font-medium">Company</th>
              <th className="px-4 py-2.5 font-medium">Price</th>
              <th className="px-4 py-2.5 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map((item) => (
              <tr key={item.symbol} className="border-t border-black/5">
                <td className="px-4 py-3 text-sm font-semibold text-[#2f2922]">{item.symbol}</td>
                <td className="px-4 py-3 text-sm text-[#655d51]">{item.company}</td>
                <td className="px-4 py-3 text-sm text-[#2f2922]">{item.price}</td>
                <td
                  className={`px-4 py-3 text-sm font-medium ${
                    item.trend === "up" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {item.change}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
