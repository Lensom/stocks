import { RequireAuth } from "@/components/auth/require-auth";
import { SubcategoriesSection } from "@/components/categories/subcategories-section";

export default function InvestingPage() {
  return (
    <RequireAuth>
      <div className="space-y-7">
        <section className="rounded-[1.75rem] border border-black/5 bg-[#f1ece1] p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8f8676]">
            Category
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#1f1c17] md:text-4xl">
            Investing
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#655d51]">
            Prototype workspace for portfolio tracking. Everything here is mock data
            (no API calls) so we can iterate on UX fast.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-medium text-[#6f675b]">
              Rebalance: mock rule
            </span>
          </div>
        </section>

        <SubcategoriesSection categorySlug="investing" />
      </div>
    </RequireAuth>
  );
}
