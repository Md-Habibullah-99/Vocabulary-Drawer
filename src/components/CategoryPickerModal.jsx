/**
 * CategoryPickerModal.jsx
 * -------------------------
 * Shared modal for WordCard's three-dot menu -> "Move" and "Copy"
 * actions on the management page. Both actions need the exact same
 * thing — pick a destination category from *every* category in the
 * account, not just whatever the current search filter happens to be
 * showing — so they share this one component instead of two near-
 * identical pickers.
 *
 * "Copy" additionally carries the required warning
 * ("You are about to create an exact duplicate...") right inside the
 * same dialog rather than as a separate second modal to click
 * through: the destination picker and the warning are answered by the
 * same Cancel/Confirm pair, so a stacked second dialog would just add
 * an extra click without adding any real safety.
 *
 * Rendered as a portal onto document.body — same reasoning as every
 * other confirmation modal in this app (see MergeConfirmModal.jsx for
 * the full explanation of why: WordCard lives inside a scrollable
 * category section, and any scrollable/transformed ancestor breaks
 * `position: fixed`).
 *
 * Props:
 *  - pending: { mode: 'move' | 'copy', card, categories: string[] } | null
 *    — modal is hidden entirely when null. `categories` is expected to
 *    be the FULL unfiltered category list (see ManagePage.jsx), so a
 *    word can be moved/copied to a category the search box is
 *    currently hiding.
 *  - onConfirm: (targetCategory: string) => void
 *  - onCancel: () => void
 */
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FolderInput, Copy, TriangleAlert } from "lucide-react";

export default function CategoryPickerModal({ pending, onConfirm, onCancel }) {
  const [selected, setSelected] = useState("");

  // Re-seed the selection every time a new picker opens, defaulting to
  // the first category the card *isn't* already in — so hitting
  // confirm immediately is never a silent same-category no-op.
  useEffect(() => {
    if (!pending) return;
    const { card, categories } = pending;
    const firstOther = categories.find((c) => c !== card.category);
    setSelected(firstOther || categories[0] || "");
  }, [pending]);

  if (!pending) return null;

  const { mode, card, categories } = pending;
  const isCopy = mode === "copy";
  const wouldBeNoOpMove = !isCopy && selected === card.category;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isCopy ? "Copy word to another category" : "Move word to another category"}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <div aria-hidden="true" onClick={onCancel} className="absolute inset-0 bg-ink/40" />

      <div className="relative bg-paper border border-rule rounded-sm shadow-xl w-full max-w-sm p-5">
        <div className="flex items-start gap-2.5 mb-2">
          {isCopy ? (
            <Copy size={18} className="text-accent flex-shrink-0 mt-0.5" />
          ) : (
            <FolderInput size={18} className="text-accent flex-shrink-0 mt-0.5" />
          )}
          <h3 className="font-display font-semibold text-ink text-base">
            {isCopy ? "Copy" : "Move"}{" "}
            <span className="font-medium">"{card.word || "(untitled)"}"</span>
          </h3>
        </div>

        <p className="font-body text-sm text-ink/70 mb-3">
          Currently in <span className="font-medium text-ink">"{card.category}"</span>. Choose a
          category to {isCopy ? "copy it into" : "move it to"}:
        </p>

        {categories.length === 0 ? (
          <p className="text-xs text-ink/40 mb-4">No categories exist yet.</p>
        ) : (
          <select
            autoFocus
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full bg-paper border border-rule rounded-sm px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:border-accent mb-4"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === card.category ? `${c} (current)` : c}
              </option>
            ))}
          </select>
        )}

        {isCopy && (
          <div className="flex items-start gap-2 border border-accent/30 bg-accent/5 rounded-sm px-3 py-2.5 mb-4">
            <TriangleAlert size={15} className="text-accent flex-shrink-0 mt-0.5" />
            <p className="font-body text-xs text-ink/70">
              You are about to create an exact duplicate of this word in another category. You
              will need to edit it later to change its details. Do you want to proceed?
            </p>
          </div>
        )}

        {wouldBeNoOpMove && (
          <p className="text-[11px] text-ink/40 -mt-2 mb-4">
            This word is already in "{card.category}" — pick a different category to move it.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-sm border border-rule text-sm text-ink/70 hover:border-ink/40 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected || wouldBeNoOpMove}
            onClick={() => onConfirm(selected)}
            className="px-3 py-1.5 rounded-sm bg-accent text-paper text-sm font-medium hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {isCopy ? "Copy word" : "Move word"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
