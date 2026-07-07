/**
 * WordCard.jsx
 * -------------
 * A single draggable card row for the management page (see
 * ManagePage.jsx). This is the "feature 1" piece: dragging one of
 * these off its category section and dropping it onto a different
 * category section moves just that one card, via onMoveToCategory
 * (App.jsx's moveCardToCategory action) — as opposed to Sidebar's
 * category-level drag, which moves every card in the category at once.
 *
 * Reuses WordManager's EditableField/FIELDS so inline editing (click a
 * field, type, blur/Enter to commit, Escape to revert) behaves
 * identically to the existing word manager in Settings.
 *
 * Native HTML5 drag-and-drop (draggable + onDragStart/onDrop), matching
 * the pattern already used for category-level dragging in Sidebar.jsx
 * — no new drag-and-drop library needed for this.
 *
 * Props:
 *  - card: { id, word, meaning, example, exampleMeaning, category, statuses }
 *  - onUpdateCard: (cardId, updates) => void
 *  - isDragging: boolean — true while THIS card is the one being dragged
 *  - onDragStart / onDragEnd: (e, cardId) => void / () => void
 */
import React from "react";
import { GripVertical } from "lucide-react";
import { EditableField, FIELDS } from "./WordManager";

export default function WordCard({ card, onUpdateCard, isDragging, onDragStart, onDragEnd }) {
  return (
    <li
      draggable
      onDragStart={(e) => onDragStart(e, card.id)}
      onDragEnd={onDragEnd}
      className={`border border-rule rounded-sm px-3 py-2.5 flex flex-col gap-1.5 bg-paper transition-opacity ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-ink/25 cursor-grab active:cursor-grabbing flex-shrink-0"
          aria-hidden="true"
          title="Drag to move to another category"
        >
          <GripVertical size={14} />
        </span>
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
