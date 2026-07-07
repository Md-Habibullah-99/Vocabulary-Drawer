/**
 * DeleteCategoryModal.jsx
 * ------------------------
 * Confirmation dialog for ManagePage's category three-dot menu ->
 * "Delete" action. A category is never removed silently: the learner
 * must explicitly choose what happens to the words inside it first.
 *
 * Two outcomes on offer:
 *  - "Move words to General"  — every card keeps existing, just
 *    re-filed under the app's existing default category ("General" —
 *    the same fallback addCard() already uses for a blank category
 *    field, so this reuses a name the app already treats as "the
 *    catch-all" rather than inventing a second one). Implemented as
 *    mergeCategory(category, "General"), i.e. exactly the same
 *    string-rewrite the app already uses for merges — no new data
 *    action needed for this branch.
 *  - "Delete words permanently" — the category AND every card inside
 *    it are gone for good. Implemented via deleteCategoryCards.
 *
 * Rendered as a portal straight onto document.body (see
 * MergeConfirmModal.jsx for why: any scrollable/transformed ancestor
 * would otherwise break `position: fixed`).
 *
 * Props:
 *  - pendingDelete: { category: string, wordCount: number } | null —
 *    modal is hidden entirely when null
 *  - onMergeIntoDefault: () => void
 *  - onDeleteWords: () => void
 *  - onCancel: () => void
 */
import React from "react";
import { createPortal } from "react-dom";
import { TriangleAlert } from "lucide-react";

const DEFAULT_CATEGORY = "General";

export default function DeleteCategoryModal({
  pendingDelete,
  onMergeIntoDefault,
  onDeleteWords,
  onCancel,
}) {
  if (!pendingDelete) return null;

  const { category, wordCount } = pendingDelete;
  // Merging "General" into itself would be a no-op that hides the real
  // consequence from the learner, so that option is dropped for this
  // one category — deleting permanently is the only meaningful choice.
  const canMergeIntoDefault = category !== DEFAULT_CATEGORY;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Delete category ${category}`}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <div aria-hidden="true" onClick={onCancel} className="absolute inset-0 bg-ink/40" />

      <div className="relative bg-paper border border-rule rounded-sm shadow-xl w-full max-w-sm p-5">
        <div className="flex items-start gap-2.5 mb-2">
          <TriangleAlert size={18} className="text-accent flex-shrink-0 mt-0.5" />
          <h3 className="font-display font-semibold text-ink text-base">
            Delete "{category}"?
          </h3>
        </div>

        <p className="font-body text-sm text-ink/70 mb-5">
          {wordCount === 0 ? (
            <>This category has no words in it. It will simply be removed.</>
          ) : (
            <>
              This category has{" "}
              <span className="font-medium text-ink">
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </span>
              . Choose what should happen to {wordCount === 1 ? "it" : "them"} before
              "{category}" is removed — this can't be undone.
            </>
          )}
        </p>

        <div className="flex flex-col gap-2">
          {wordCount > 0 && canMergeIntoDefault && (
            <button
              type="button"
              onClick={onMergeIntoDefault}
              className="w-full px-3 py-2 rounded-sm border border-rule text-sm text-ink/80 hover:border-ink/40 transition-colors text-left"
            >
              Move {wordCount === 1 ? "it" : "them"} to "{DEFAULT_CATEGORY}"
              <span className="block text-[11px] text-ink/45 mt-0.5">
                Words are kept and re-filed under the default category.
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onDeleteWords}
            className="w-full px-3 py-2 rounded-sm border border-accent/40 text-sm text-accent hover:bg-accent/5 transition-colors text-left"
          >
            Delete {wordCount > 0 ? (wordCount === 1 ? "it" : "them") : "category"} permanently
            {wordCount > 0 && (
              <span className="block text-[11px] text-accent/70 mt-0.5">
                {wordCount === 1 ? "This word" : "These words"} will be removed for good.
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full px-3 py-1.5 rounded-sm text-sm text-ink/55 hover:text-ink/80 transition-colors text-center mt-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
