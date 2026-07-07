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
 * Three-dot menu: each card also has its own MoreVertical menu — the
 * exact same pattern as the category header's three-dot menu in
 * ManagePage.jsx (button toggles an absolute-positioned dropdown;
 * a destructive action is never wired straight to the menu item, it
 * opens a confirmation modal instead). Currently offers just "Delete",
 * since renaming a word's fields is already handled by the inline
 * EditableField click-to-edit below — there's no separate "rename"
 * action needed the way there is for a whole category.
 *
 * Props:
 *  - card: { id, word, meaning, example, exampleMeaning, category, statuses }
 *  - onUpdateCard: (cardId, updates) => void
 *  - onDeleteCard: (cardId) => void
 *  - isDragging: boolean — true while THIS card is the one being dragged
 *  - onDragStart / onDragEnd: (e, cardId) => void / () => void
 */
import React, { useState } from "react";
import { GripVertical, MoreVertical, Trash2 } from "lucide-react";
import { EditableField, FIELDS } from "./WordManager";
import DeleteWordModal from "./DeleteWordModal";

export default function WordCard({
  card,
  onUpdateCard,
  onDeleteCard,
  isDragging,
  onDragStart,
  onDragEnd,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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

        <div className="relative flex-shrink-0 ml-auto">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={`Manage "${card.word || "word"}"`}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            className="p-1 rounded-sm text-ink/40 hover:text-ink/70 hover:bg-ink/[0.04]"
          >
            <MoreVertical size={14} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 bg-paper border border-rule rounded-sm shadow-md py-1 w-36">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmingDelete(true);
                }}
                className="w-full text-left px-3 py-1.5 text-[13px] text-accent hover:bg-accent/5 flex items-center gap-2"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </div>
          )}
        </div>
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

      <DeleteWordModal
        pendingDelete={confirmingDelete ? { word: card.word, meaning: card.meaning } : null}
        onConfirm={() => {
          setConfirmingDelete(false);
          onDeleteCard(card.id);
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </li>
  );
}
