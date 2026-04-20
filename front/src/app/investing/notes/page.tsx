"use client";

import Link from "next/link";
import { useInvesting } from "@/state/investing-store";

export default function InvestingNotesPage() {
  const { notes, notesMeta, isNotesLoading, isNotesDirty, isNotesSaving, setNotes, saveNotes } = useInvesting();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8f8676]">
            Investing
          </p>
          <h1 className="mt-1.5 text-3xl font-semibold text-[#1f1c17]">Notes</h1>
          <p className="mt-1.5 text-sm text-[#655d51]">
            Personal investing notes stored per user in database.
          </p>
        </div>
        <Link
          href="/investing"
          className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-medium text-[#3b352d]"
        >
          Back
        </Link>
      </div>

      <article className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[#8f8676]">
            {notesMeta.updatedAt ? `Updated ${new Date(notesMeta.updatedAt).toLocaleString()}` : "Not saved yet"}
          </p>
          <button
            type="button"
            onClick={() => void saveNotes()}
            disabled={!isNotesDirty || isNotesSaving || isNotesLoading}
            className={[
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition",
              !isNotesDirty || isNotesSaving || isNotesLoading
                ? "cursor-not-allowed bg-black/10 text-[#6f675b]"
                : "bg-[#1f1c17] text-[#f8f4eb] hover:bg-[#2c2923]",
            ].join(" ")}
          >
            {isNotesSaving ? "Saving..." : "Save notes"}
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write your investing notes..."
          className="min-h-[380px] w-full resize-y rounded-xl border border-black/10 bg-[#faf8f2] p-4 text-sm leading-6 text-[#2f2922] outline-none focus:border-black/20"
        />
      </article>
    </div>
  );
}
