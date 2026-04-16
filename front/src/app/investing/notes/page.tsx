import Link from "next/link";
import { investingNotes } from "@/data/mock-jarvis";

export default function InvestingNotesPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8f8676]">
            Investing
          </p>
          <h1 className="mt-1.5 text-3xl font-semibold text-[#1f1c17]">Notes</h1>
          <p className="mt-1.5 text-sm text-[#655d51]">
            Lightweight research log (mock).
          </p>
        </div>
        <Link
          href="/investing"
          className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-medium text-[#3b352d]"
        >
          Back
        </Link>
      </div>

      <div className="grid gap-3.5">
        {investingNotes.map((n) => (
          <article
            key={n.title}
            className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-black/10 bg-[#faf8f2] px-2.5 py-1 text-xs font-medium text-[#6f675b]">
                  {n.tag}
                </span>
                <p className="text-xs text-[#8f8676]">{n.updatedAt}</p>
              </div>
            </div>
            <h2 className="mt-3 text-xl font-semibold leading-tight text-[#1f1c17]">
              {n.title}
            </h2>
            <p className="mt-2 text-sm text-[#655d51]">{n.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
