import { marketNews } from "@/data/mock-stock-data";

export default function NewsPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8f8676]">
          Insights
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold text-[#1f1c17]">Market News</h1>
        <p className="mt-1.5 text-sm text-[#655d51]">Static feed for layout and content testing.</p>
      </div>

      <div className="grid gap-3.5">
        {marketNews.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#655d51]">{item.source}</p>
              <p className="text-xs text-[#8f8676]">{item.time}</p>
            </div>
            <h2 className="mt-2 text-xl font-semibold leading-tight text-[#1f1c17]">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-[#655d51]">{item.summary}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
