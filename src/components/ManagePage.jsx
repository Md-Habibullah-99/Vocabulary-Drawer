/**
 * ManagePage.jsx
 * ---------------
 * Dedicated "/manage" route: a dashboard for adding words and
 * reorganizing the deck, combining things that used to be spread
 * across (or entirely missing from) Settings and the Sidebar:
 *
 *  1. AddWordForm — English word / meaning / example sentence / example
 *     meaning (+ category) inputs, wired to the new addCard action.
 *  2. Per-card drag-and-drop between categories — drag a WordCard out
 *     of one category section and drop it on another; that ONE card's
 *     `category` field updates immediately (moveCardToCategory).
 *  3. Category-level drag-and-drop merging — dragging a category
 *     SECTION HEADER onto another still does the existing "merge every
 *     word from A into B" behavior from Sidebar.jsx, reusing the exact
 *     same hook + confirmation modal so both places behave identically.
 *  4. Collapsible category sections — each category is an accordion:
 *     collapsed by default (keeps the page scannable with many
 *     categories), toggled open by clicking its header, with a chevron
 *     that rotates to reflect state. While the learner is filtering
 *     via the search box, matching sections auto-expand so results
 *     are never hidden behind a collapsed header.
 *  5. A three-dot menu on each category header for Rename and Delete:
 *      - Rename turns the header into an inline input (Save/Cancel).
 *        Implemented as onMergeCategory(oldName, newName) — renaming
 *        IS a merge into a brand-new name, see categoryTree.js.
 *      - Delete opens DeleteCategoryModal, which requires the learner
 *        to explicitly choose between moving the category's words into
 *        "General" (a merge, same mechanism as rename) or deleting
 *        them permanently (onDeleteCategoryCards) — never both
 *        silently, and never without this confirmation step.
 *
 * These two kinds of drag (single card vs whole category) both end on
 * the same section elements, so they're disambiguated by local state:
 * a card-drag in progress (`draggingCardId`) takes priority over the
 * category-merge hook's drag state when deciding what a drop means.
 *
 * Props:
 *  - cards: full card array
 *  - onAddCard: (cardData) => void
 *  - onUpdateCard: (cardId, updates) => void
 *  - onMoveCardToCategory: (cardId, newCategory) => void
 *  - onCopyCard: (cardId, newCategory) => void — duplicates a card into
 *    another category; see WordCard.jsx's "Copy" menu item
 *  - onMergeCategory: (fromCategory, toCategory) => void
 *  - onDeleteCategoryCards: (category) => void
 *  - onDeleteCard: (cardId) => void
 */
import React, { useState, useMemo } from "react";
import {
  Search,
  FolderInput,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import WordCard from "./WordCard";
import AddWordForm from "./AddWordForm";
import MergeConfirmModal from "./MergeConfirmModal";
import DeleteCategoryModal from "./DeleteCategoryModal";
import { useCategoryMergeDrag } from "../hooks/useCategoryMergeDrag";
import { getCategoryList, getCardsForCategory, ALL_WORDS_CATEGORY } from "../utils/categoryTree";

export default function ManagePage({
  cards,
  onAddCard,
  onUpdateCard,
  onMoveCardToCategory,
  onCopyCard,
  onMergeCategory,
  onDeleteCategoryCards,
  onDeleteCard,
}) {
  const [query, setQuery] = useState("");
  const [draggingCardId, setDraggingCardId] = useState(null);
  const [cardDragOverCategory, setCardDragOverCategory] = useState(null);

  // Accordion state: which category sections are expanded. Categories
  // start absent from this map (=> collapsed) so a brand-new/renamed
  // category simply defaults closed, same as everything else.
  const [expandedCategories, setExpandedCategories] = useState({});

  // Three-dot menu + rename/delete flow state.
  const [categoryMenuOpenFor, setCategoryMenuOpenFor] = useState(null);
  const [renamingCategory, setRenamingCategory] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null); // { category, wordCount } | null

  // Real categories only — "All Words" is a pseudo-category (every
  // card at once), it isn't something a word can be filed under or a
  // section that should appear on this page.
  const categories = useMemo(
    () => getCategoryList(cards).filter((c) => c !== ALL_WORDS_CATEGORY),
    [cards]
  );

  const categoryMerge = useCategoryMergeDrag(onMergeCategory);

  const isFiltering = query.trim().length > 0;

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((card) =>
      [card.word, card.meaning, card.example, card.exampleMeaning, card.category]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [cards, query]);

  // ---- Accordion ---------------------------------------------------------

  const toggleCategoryExpanded = (category) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  // ---- Rename (three-dot menu) -------------------------------------------

  const startRename = (category) => {
    setRenamingCategory(category);
    setRenameValue(category);
    setCategoryMenuOpenFor(null);
  };

  const confirmRename = () => {
    const trimmed = renameValue.trim();
    if (renamingCategory && trimmed && trimmed !== renamingCategory) {
      onMergeCategory(renamingCategory, trimmed);
    }
    setRenamingCategory(null);
    setRenameValue("");
  };

  const cancelRename = () => {
    setRenamingCategory(null);
    setRenameValue("");
  };

  // ---- Delete (three-dot menu) -------------------------------------------

  const startDelete = (category) => {
    setPendingDelete({
      category,
      wordCount: getCardsForCategory(cards, category).length,
    });
    setCategoryMenuOpenFor(null);
  };

  const confirmMergeIntoDefault = () => {
    if (pendingDelete) onMergeCategory(pendingDelete.category, "General");
    setPendingDelete(null);
  };

  const confirmDeleteWords = () => {
    if (pendingDelete) onDeleteCategoryCards(pendingDelete.category);
    setPendingDelete(null);
  };

  const cancelDelete = () => setPendingDelete(null);

  // ---- Per-card drag handlers ---------------------------------------------

  const handleCardDragStart = (e, cardId) => {
    setDraggingCardId(cardId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", cardId);
    e.stopPropagation();
  };

  const handleCardDragEnd = () => {
    setDraggingCardId(null);
    setCardDragOverCategory(null);
  };

  // ---- Section-level drop target: disambiguates a card-drag from a
  // category-header-drag (from useCategoryMergeDrag) and routes the
  // drop to the right action. ------------------------------------------

  const handleSectionDragOver = (e, category) => {
    if (draggingCardId) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setCardDragOverCategory((prev) => (prev === category ? prev : category));
      return;
    }
    categoryMerge.handleDragOver(e, category);
  };

  const handleSectionDragLeave = (category) => {
    if (draggingCardId) {
      setCardDragOverCategory((prev) => (prev === category ? null : prev));
      return;
    }
    categoryMerge.handleDragLeave(category);
  };

  const handleSectionDrop = (e, category) => {
    if (draggingCardId) {
      e.preventDefault();
      if (category !== cardOwningCategory(cards, draggingCardId)) {
        onMoveCardToCategory(draggingCardId, category);
      }
      setDraggingCardId(null);
      setCardDragOverCategory(null);
      return;
    }
    categoryMerge.handleDrop(e, category);
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-5 py-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div>
          <h2 className="font-display font-semibold text-ink text-xl mb-1">
            Manage vocabulary
          </h2>
          <p className="font-body text-sm text-ink/55">
            Add new words, drag a word onto a different category to move it, or drag a
            category's header onto another category to merge them. Click a category to
            expand it, or use its menu to rename or delete it.
          </p>
        </div>

        <AddWordForm categories={categories} onAddCard={onAddCard} />

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
        ) : (
          <div className="flex flex-col gap-5">
            {categories.map((category) => {
              const sectionCards = getCardsForCategory(filteredCards, category);
              if (isFiltering && sectionCards.length === 0) return null;

              // While filtering, force every matching section open so
              // results are never hidden behind a collapsed header.
              const isOpen = isFiltering ? true : !!expandedCategories[category];

              const isCategoryBeingDragged = categoryMerge.draggingCategory === category;
              const isCategoryDropTarget = categoryMerge.dragOverCategory === category;
              const isCardDropTarget = cardDragOverCategory === category;
              const isRenamingThis = renamingCategory === category;

              return (
                <section
                  key={category}
                  onDragOver={(e) => handleSectionDragOver(e, category)}
                  onDragLeave={() => handleSectionDragLeave(category)}
                  onDrop={(e) => handleSectionDrop(e, category)}
                  className={`border border-rule rounded-sm transition-colors ${
                    isCategoryDropTarget || isCardDropTarget
                      ? "bg-accent/5 ring-1 ring-accent/40"
                      : ""
                  }`}
                >
                  <div
                    draggable={!isRenamingThis}
                    onDragStart={(e) => categoryMerge.handleDragStart(e, category)}
                    onDragEnd={categoryMerge.handleDragEnd}
                    className={`flex items-center gap-1 border-b border-rule ${
                      isCategoryBeingDragged ? "opacity-40" : ""
                    }`}
                  >
                    {isRenamingThis ? (
                      <div className="flex-1 flex items-center gap-1.5 px-3.5 py-1.5 min-w-0">
                        <FolderInput size={13} className="text-ink/35 flex-shrink-0" />
                        <input
                          autoFocus
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") confirmRename();
                            if (e.key === "Escape") cancelRename();
                          }}
                          className="flex-1 min-w-0 bg-paper border border-rule rounded-sm px-2 py-1 text-sm text-ink focus:outline-none focus:border-accent"
                        />
                        <button
                          type="button"
                          onClick={confirmRename}
                          aria-label="Save category name"
                          className="p-1 rounded-sm text-sage hover:bg-sage/10 flex-shrink-0"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={cancelRename}
                          aria-label="Cancel rename"
                          className="p-1 rounded-sm text-ink/40 hover:bg-ink/[0.05] flex-shrink-0"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleCategoryExpanded(category)}
                        title="Click to expand/collapse, or drag onto another category to merge"
                        aria-expanded={isOpen}
                        className="flex-1 flex items-center gap-2 px-3.5 py-2 text-left cursor-grab active:cursor-grabbing min-w-0"
                      >
                        <ChevronRight
                          size={14}
                          className={`flex-shrink-0 text-ink/35 transition-transform duration-150 ${
                            isOpen ? "rotate-90" : ""
                          }`}
                        />
                        <FolderInput size={13} className="text-ink/35 flex-shrink-0" />
                        <h3 className="font-body text-sm font-medium text-ink truncate">
                          {category}
                        </h3>
                        <span className="font-mono text-[11px] text-ink/35 ml-auto flex-shrink-0">
                          {sectionCards.length}
                        </span>
                      </button>
                    )}

                    {!isRenamingThis && (
                      <div className="relative flex-shrink-0 pr-2">
                        <button
                          type="button"
                          onClick={() =>
                            setCategoryMenuOpenFor((prev) =>
                              prev === category ? null : category
                            )
                          }
                          aria-label={`Manage ${category}`}
                          aria-haspopup="true"
                          aria-expanded={categoryMenuOpenFor === category}
                          className="p-1.5 rounded-sm text-ink/40 hover:text-ink/70 hover:bg-ink/[0.04]"
                        >
                          <MoreVertical size={14} />
                        </button>

                        {categoryMenuOpenFor === category && (
                          <div className="absolute right-0 top-full mt-1 z-20 bg-paper border border-rule rounded-sm shadow-md py-1 w-40">
                            <button
                              type="button"
                              onClick={() => startRename(category)}
                              className="w-full text-left px-3 py-1.5 text-[13px] text-ink/80 hover:bg-ink/[0.05] flex items-center gap-2"
                            >
                              <Pencil size={12} />
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => startDelete(category)}
                              className="w-full text-left px-3 py-1.5 text-[13px] text-accent hover:bg-accent/5 flex items-center gap-2"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isOpen &&
                    (sectionCards.length === 0 ? (
                      <p className="text-xs text-ink/35 px-3.5 py-3">
                        Drop a word here to move it into "{category}".
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-2 p-3">
                        {sectionCards.map((card) => (
                          <WordCard
                            key={card.id}
                            card={card}
                            categories={categories}
                            onUpdateCard={onUpdateCard}
                            onDeleteCard={onDeleteCard}
                            onMoveToCategory={onMoveCardToCategory}
                            onCopyCard={onCopyCard}
                            isDragging={draggingCardId === card.id}
                            onDragStart={handleCardDragStart}
                            onDragEnd={handleCardDragEnd}
                          />
                        ))}
                      </ul>
                    ))}
                </section>
              );
            })}
          </div>
        )}
      </div>

      <MergeConfirmModal
        pendingMerge={categoryMerge.pendingDropMerge}
        onConfirm={categoryMerge.confirmDropMerge}
        onCancel={categoryMerge.cancelDropMerge}
      />

      <DeleteCategoryModal
        pendingDelete={pendingDelete}
        onMergeIntoDefault={confirmMergeIntoDefault}
        onDeleteWords={confirmDeleteWords}
        onCancel={cancelDelete}
      />
    </div>
  );
}

function cardOwningCategory(cards, cardId) {
  return cards.find((c) => c.id === cardId)?.category;
}
