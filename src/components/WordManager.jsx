/**
 * WordManager.jsx
 * ----------------
 * A management view listing every currently loaded card so a learner
 * can fix a typo in a word, meaning, or example sentence directly,
 * instead of re-uploading their whole list. Rendered inside
 * SettingsPanel as a collapsible section, matching the History section
 * right above it.
 *
 * Editing model: click any field to turn it into a text input; changes
 * commit on blur or Enter (Escape reverts), via onUpdateCard(cardId,
 * updates) — which patches global state in useFlashcards.js and, via
 * its existing persistence effect, localStorage. Nothing here talks to
 * storage directly.
 *
 * A simple text filter is included since decks can get long — it's not
 * one of the three required features, but without it this view isn't
 * usable past a couple dozen cards.
 *
 * Props:
 *  - cards: full card array [{ id, word, meaning, example, exampleMeaning, category, statuses }]
 *  - onUpdateCard: (cardId, updates: Partial<Card>) => void
 */

import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";

const FIELDS = [
  { key: "word", label: "Word", placeholder: "Word" },
  { key: "meaning", label: "Meaning", placeholder: "Meaning" },
  { key: "example", label: "Example", placeholder: "Example sentence" },
  { key: "exampleMeaning", label: "Example meaning", placeholder: "Example translation" },
];

export default function WordManager({ cards = [], onUpdateCard }) {
  const [query, setQuery] = useState("");

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((card) =>
      [card.word, card.meaning, card.example, card.exampleMeaning, card.category]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [cards, query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/35 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter words…"
          className="w-full bg-paper border border-rule rounded-sm pl-8 pr-2.5 py-1.5 text-sm text-ink focus:outline-none focus:border-accent"
        />
      </div>

      {cards.length === 0 ? (
        <p className="text-xs text-ink/40">No words loaded yet.</p>
      ) : filteredCards.length === 0 ? (
        <p className="text-xs text-ink/40">No words match "{query}".</p>
      ) : (
        <ul className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
          {filteredCards.map((card) => (
            <WordManagerRow key={card.id} card={card} onUpdateCard={onUpdateCard} />
          ))}
        </ul>
      )}
    </div>
  );
}

function WordManagerRow({ card, onUpdateCard }) {
  return (
    <li className="border border-rule rounded-sm px-3 py-2.5 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-ink/35 truncate">{card.category}</span>
      </div>
      {FIELDS.map(({ key, label, placeholder }) => (
        <EditableField
          key={key}
          label={label}
          placeholder={placeholder}
          value={card[key] || ""}
          onCommit={(newValue) => {
            if (newValue !== (card[key] || "")) {
              onUpdateCard(card.id, { [key]: newValue });
            }
          }}
        />
      ))}
    </li>
  );
}

/**
 * A single click-to-edit field. Renders as static text until clicked,
 * then swaps to a text input; blur or Enter commits, Escape reverts
 * without calling onCommit.
 */
function EditableField({ label, placeholder, value, onCommit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const startEditing = () => {
    setDraft(value);
    setIsEditing(true);
  };

  const commit = () => {
    setIsEditing(false);
    onCommit(draft.trim());
  };

  const cancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span className="text-[10px] uppercase tracking-wide text-ink/35 w-28 flex-shrink-0">
        {label}
      </span>
      {isEditing ? (
        <input
          autoFocus
          type="text"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          className="flex-1 min-w-0 bg-paper border border-accent rounded-sm px-1.5 py-0.5 text-sm text-ink focus:outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className="flex-1 min-w-0 text-left text-sm text-ink/80 hover:bg-ink/[0.04] rounded-sm px-1.5 py-0.5 truncate"
          title="Click to edit"
        >
          {value || <span className="text-ink/30 italic">{placeholder}</span>}
        </button>
      )}
    </div>
  );
}
