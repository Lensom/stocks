import Link from "next/link";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/news", label: "News" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f6f3ea]/80 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1f1c17] text-xs font-semibold text-[#f8f4eb]">
            OL
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#8f8676]">
              Olivia Finance
            </p>
            <p className="text-sm font-semibold text-[#1f1c17]">Stocks Workspace</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-black/5 bg-white/80 p-1 shadow-sm md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-[#6f675b] transition hover:bg-[#f3efe5] hover:text-[#1f1c17]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button className="rounded-full bg-[#1f1c17] px-3.5 py-1.5 text-xs font-medium text-[#f8f4eb] transition hover:bg-[#2c2923]">
          New board
        </button>
      </div>
    </header>
  );
}
