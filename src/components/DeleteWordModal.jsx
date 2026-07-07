/**
 * DeleteWordModal.jsx
 * --------------------
 * Confirmation dialog for WordCard's three-dot menu -> "Delete" action
 * on the management page. Mirrors MergeConfirmModal and
 * DeleteCategoryModal: a destructive, irreversible action never fires
 * straight from a click — it's always gated behind this modal.
 *
 * Rendered as a portal onto document.body for the same reason as the
 * other confirmation modals in this app: WordCard lives inside a
 * scrollable category section, and any scrollable/transformed
 * ancestor breaks `position: fixed` (see MergeConfirmModal.jsx for
 * the full explanation).
 *
 * Props:
 *  - pendingDelete: { word: string, meaning: string } | null — modal
 *    is hidden entirely when null
 *  - onConfirm: () => void
 *  - onCancel: () => void
 */
import React from "react";
import { createPortal } from "react-dom";
import { TriangleAlert } from "lucide-react";

export default function DeleteWordModal({ pendingDelete, onConfirm, onCancel }) {
  if (!pendingDelete) return null;

  const { word, meaning } = pendingDelete;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm word deletion"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <div aria-hidden="true" onClick={onCancel} className="absolute inset-0 bg-ink/40" />

      <div className="relative bg-paper border border-rule rounded-sm shadow-xl w-full max-w-sm p-5">
        <div className="flex items-start gap-2.5 mb-2">
          <TriangleAlert size={18} className="text-accent flex-shrink-0 mt-0.5" />
          <h3 className="font-display font-semibold text-ink text-base">Delete this word?</h3>
        </div>

        <p className="font-body text-sm text-ink/70 mb-5">
          <span className="font-medium text-ink">"{word || "(untitled)"}"</span>
          {meaning ? <> — {meaning}</> : null} will be permanently removed. This can't be
          undone.
        </p>

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
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-sm bg-accent text-paper text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
