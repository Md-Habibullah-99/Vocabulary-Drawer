/**
 * MergeConfirmModal.jsx
 * ----------------------
 * BUG FIX — viewport positioning:
 * This modal used to be rendered inline inside Sidebar.jsx's <nav>,
 * styled `fixed inset-0`. That looked right in isolation, but the
 * <nav> element itself carries Tailwind's `transform` utility class
 * (used for the mobile slide-in animation) plus `overflow-y-auto`. Per
 * the CSS spec, any ancestor with a `transform` becomes the containing
 * block for `position: fixed` descendants — so the modal was actually
 * fixed to the scrollable nav box, not the browser viewport. Scroll
 * the category list down far enough and the modal scrolled away with
 * it, off-screen.
 *
 * The fix is to render this through a portal straight onto
 * `document.body`, which has no transform/scroll ancestor of its own,
 * so `fixed inset-0` now means what it says: centered on the actual
 * viewport, no matter where the triggering list is scrolled.
 *
 * Used both by Sidebar.jsx (category merge from the drawer) and
 * ManagePage.jsx (category merge from the management dashboard) so
 * there's exactly one implementation of this dialog.
 *
 * Props:
 *  - pendingMerge: { from: string, to: string } | null — modal is
 *    hidden entirely when null
 *  - onConfirm: () => void
 *  - onCancel: () => void
 */
import React from "react";
import { createPortal } from "react-dom";

export default function MergeConfirmModal({ pendingMerge, onConfirm, onCancel }) {
  if (!pendingMerge) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm category merge"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <div
        aria-hidden="true"
        onClick={onCancel}
        className="absolute inset-0 bg-ink/40"
      />
      <div className="relative bg-paper border border-rule rounded-sm shadow-xl w-full max-w-sm p-5">
        <h3 className="font-display font-semibold text-ink text-base mb-2">
          Merge categories?
        </h3>
        <p className="font-body text-sm text-ink/70 mb-5">
          Do you want to merge{" "}
          <span className="font-medium text-ink">"{pendingMerge.from}"</span> into{" "}
          <span className="font-medium text-ink">"{pendingMerge.to}"</span>? Every
          word in "{pendingMerge.from}" will move to "{pendingMerge.to}", and
          "{pendingMerge.from}" will be removed.
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
            Merge
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
