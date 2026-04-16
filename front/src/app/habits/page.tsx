import { RequireAuth } from "@/components/auth/require-auth";
import { SubcategoriesSection } from "@/components/categories/subcategories-section";

export default function HabitsPage() {
  return (
    <RequireAuth>
      <div className="space-y-5">
        <section className="rounded-[1.75rem] border border-black/5 bg-[#f1ece1] p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8f8676]">
            Category
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#1f1c17] md:text-4xl">
            Habits
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#655d51]">
            Placeholder page. We’ll bring your habit trackers here next.
          </p>
        </section>

        <div className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
          <p className="text-sm font-semibold text-[#1f1c17]">Coming soon</p>
          <p className="mt-2 text-sm text-[#655d51]">
            Streaks, daily check-ins, and weekly summary cards.
          </p>
        </div>

        <SubcategoriesSection categorySlug="habits" />
      </div>
    </RequireAuth>
  );
}
