"use client";

import {
  investingPageStack,
  investingPrimarySaveActive,
  investingPrimarySaveDisabled,
} from "@/features/investing/ui/investing-classes";
import { useInvesting } from "@/state/investing-store";

export default function InvestingNotesPage() {
  const { notes, notesMeta, isNotesLoading, isNotesDirty, isNotesSaving, setNotes, saveNotes } = useInvesting();

  return (
    <div className={investingPageStack}>
      <p className="text-sm text-[#655d51]">Personal investing notes stored per user in database.</p>

      <article className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_8px_30px_rgba(18,16,13,0.05)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[#8f8676]">
            {notesMeta.updatedAt
              ? `Synced ${new Date(notesMeta.updatedAt).toLocaleString()}`
              : "Not synced"}
          </p>
          <button
            type="button"
            onClick={() => void saveNotes()}
            disabled={!isNotesDirty || isNotesSaving || isNotesLoading}
            className={[
              "transition",
              !isNotesDirty || isNotesSaving || isNotesLoading
                ? investingPrimarySaveDisabled
                : investingPrimarySaveActive,
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
