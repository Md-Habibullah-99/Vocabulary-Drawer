/**
 * Flashcard.jsx
 * --------------
 * The interactive index-card component. Visual signature:
 *  - Proportioned and colored like a physical 3x5 index card.
 *  - A die-cut notch in the top-right corner (pure CSS, via a clipped
 *    pseudo-corner) — a small detail that sells the "real card" feel.
 *  - Clicking ANYWHERE on the card boundary performs a 3D flip
 *    (rotateY) between the word side and the meaning side, rather than
 *    a simple fade — this is the app's signature interaction.
 *  - Status buttons (Difficult / Easy / Favorite / Done) sit below the
 *    card so they're always reachable without flipping.
 *
 * Props:
 *  - card: the active flashcard object { id, word, meaning, example, exampleMeaning, status }
 *  - isRevealed: boolean — whether the meaning side is currently showing
 *  - onToggleReveal: () => void — called when the card is clicked
 *  - onSetStatus: (status) => void — called when a status button is pressed
 */

import React from "react";
import {
  Heart,
  CircleCheck,
  TriangleAlert,
  Sparkles,
} from "lucide-react";

const STATUS_BUTTONS = [
  {
    key: "difficult",
    label: "Difficult",
    Icon: TriangleAlert,
    activeClasses: "bg-accent text-paper border-accent",
  },
  {
    key: "easy",
    label: "Easy",
    Icon: Sparkles,
    activeClasses: "bg-sage text-paper border-sage",
  },
  {
    key: "favorite",
    label: "Favorite",
    Icon: Heart,
    activeClasses: "bg-brass text-paper border-brass",
  },
  {
    key: "done",
    label: "Done",
    Icon: CircleCheck,
    activeClasses: "bg-ink text-paper border-ink",
  },
];

export default function Flashcard({ card, isRevealed, onToggleReveal, onSetStatus }) {
  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center h-72 border-2 border-dashed border-rule rounded-sm text-ink/50 font-body">
        <p className="text-lg">No cards in this view yet.</p>
        <p className="text-sm mt-1">Mark some cards, or pick another category.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Card index number, catalog-style, sits above the card like a tab label */}
      <div className="font-mono text-xs tracking-widest text-ink/50 mb-2 uppercase">
        {card.id} &middot; {card.category}
      </div>

      <div className="flip-perspective w-full max-w-md">
        <button
          type="button"
          onClick={onToggleReveal}
          aria-pressed={isRevealed}
          aria-label={isRevealed ? "Hide meaning" : "Reveal meaning"}
          className={`flip-card relative w-full h-72 cursor-pointer text-left ${
            isRevealed ? "is-flipped" : ""
          }`}
        >
          {/* FRONT FACE — the foreign word, hidden meaning */}
          <div className="flip-face absolute inset-0 bg-paper border border-rule rounded-sm shadow-[0_2px_0_0_rgba(43,38,34,0.08)] flex flex-col items-center justify-center px-8">
            <CornerNotch />
            <RuleLines />
            <span className="font-display font-semibold text-4xl text-ink text-center relative z-10">
              {card.word}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mt-4 relative z-10">
              Tap to reveal
            </span>
          </div>

          {/* BACK FACE — meaning + example, shown after the flip */}
          <div className="flip-face flip-face-back absolute inset-0 bg-paper border border-rule rounded-sm shadow-[0_2px_0_0_rgba(43,38,34,0.08)] flex flex-col items-center justify-center px-8 text-center">
            <CornerNotch />
            <RuleLines />
            <span className="font-display font-semibold text-2xl text-accent relative z-10">
              {card.meaning}
            </span>
            {card.example && (
              <p className="font-body text-sm text-ink/80 mt-5 italic relative z-10 max-w-xs">
                "{card.example}"
              </p>
            )}
            {card.exampleMeaning && (
              <p className="font-body text-sm text-ink/50 mt-1 relative z-10 max-w-xs">
                {card.exampleMeaning}
              </p>
            )}
          </div>
        </button>
      </div>

      {/* Status marking row */}
      <div className="flex flex-wrap gap-2 mt-5 justify-center">
        {STATUS_BUTTONS.map(({ key, label, Icon, activeClasses }) => {
          const isActive = card.status === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSetStatus(key)}
              aria-pressed={isActive}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border font-body text-sm transition-colors ${
                isActive
                  ? activeClasses
                  : "bg-paper text-ink/70 border-rule hover:border-ink/40"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Decorative die-cut notch in the top-right corner — the card's signature detail. */
function CornerNotch() {
  return (
    <div
      aria-hidden="true"
      className="absolute top-0 right-0 w-5 h-5 bg-[#F6F1E7]"
      style={{
        clipPath: "polygon(100% 0, 0 0, 100% 100%)",
        boxShadow: "inset 1px -1px 0 0 rgba(43,38,34,0.15)",
      }}
    />
  );
}

/** Faint horizontal rule lines, like a real index card, behind the content. */
function RuleLines() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex flex-col justify-evenly px-6 py-10 opacity-40 pointer-events-none"
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-px bg-rule" />
      ))}
    </div>
  );
}
