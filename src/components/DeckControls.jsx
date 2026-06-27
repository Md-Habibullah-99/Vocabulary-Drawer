/**
 * DeckControls.jsx
 * -----------------
 * Previous / Next navigation, placed below the flashcard, plus a small
 * "3 / 24" position indicator in the catalog-card mono style.
 */

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DeckControls({ currentIndex, deckLength, onPrevious, onNext }) {
  const disabled = deckLength === 0;

  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      <button
        type="button"
        onClick={onPrevious}
        disabled={disabled}
        aria-label="Previous card"
        className="flex items-center gap-1 px-4 py-2 rounded-sm border border-rule text-ink/75 font-body text-sm hover:border-ink/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
        Previous
      </button>

      <span className="font-mono text-xs text-ink/40 min-w-[3.5rem] text-center">
        {disabled ? "0 / 0" : `${currentIndex + 1} / ${deckLength}`}
      </span>

      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        aria-label="Next card"
        className="flex items-center gap-1 px-4 py-2 rounded-sm border border-rule text-ink/75 font-body text-sm hover:border-ink/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
