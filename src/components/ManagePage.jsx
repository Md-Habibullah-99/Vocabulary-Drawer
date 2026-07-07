/**
 * ManagePage.jsx
 * ---------------
 * Dedicated "/manage" route: a dashboard for adding words and
 * reorganizing the deck, combining three things that used to be spread
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
 *
 * These two kinds of drag (single card vs whole category) both end on
 * the same section elements, so they're disambiguated by local state:
 * a card-drag in progress (`draggingCardId`) takes priority over the
 * category-merge hook's drag state when deciding what a drop means.
 *
 * Props:
 *  - cards, categories, tags-adjacent props aren't needed here — just:
 *  - cards: full card array
 *  - onAddCard: (cardData) => void
 *  - onUpdateCard: (cardId, updates) => void
 *  - onMoveCardToCategory: (cardId, newCategory) => void
 *  - onMergeCategory: (fromCategory, toCategory) => void
 */
import React, { useState, useMemo } from "react";
import { Search, FolderInput } from "lucide-react";
import WordCard from "./WordCard";
import AddWordForm from "./AddWordForm";
import MergeConfirmModal from "./MergeConfirmModal";
import { useCategoryMergeDrag } from "../hooks/useCategoryMergeDrag";
import { getCategoryList, getCardsForCategory, ALL_WORDS_CATEGORY } from "../utils/categoryTree";

export default function ManagePage({
  cards,
  onAddCard,
  onUpdateCard,
  onMoveCardToCategory,
  onMergeCategory,
}) {
  const [query, setQuery] = useState("");
  const [draggingCardId, setDraggingCardId] = useState(null);
  const [cardDragOverCategory, setCardDragOverCategory] = useState(null);

  // Real categories only — "All Words" is a pseudo-category (every
  // card at once), it isn't something a word can be filed under or a
  // section that should appear on this page.
  const categories = useMemo(
    () => getCategoryList(cards).filter((c) => c !== ALL_WORDS_CATEGORY),
    [cards]
  );

  const categoryMerge = useCategoryMergeDrag(onMergeCategory);

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((card) =>
      [card.word, card.meaning, card.example, card.exampleMeaning, card.category]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [cards, query]);

  // ---- Per-card drag handlers ------------------------------------------

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
            category's header onto another category to merge them.
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
              if (query.trim() && sectionCards.length === 0) return null;

              const isCategoryBeingDragged = categoryMerge.draggingCategory === category;
              const isCategoryDropTarget = categoryMerge.dragOverCategory === category;
              const isCardDropTarget = cardDragOverCategory === category;

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
                    draggable
                    onDragStart={(e) => categoryMerge.handleDragStart(e, category)}
                    onDragEnd={categoryMerge.handleDragEnd}
                    title="Drag onto another category to merge"
                    className={`flex items-center gap-2 px-3.5 py-2 border-b border-rule cursor-grab active:cursor-grabbing ${
                      isCategoryBeingDragged ? "opacity-40" : ""
                    }`}
                  >
                    <FolderInput size={13} className="text-ink/35 flex-shrink-0" />
                    <h3 className="font-body text-sm font-medium text-ink truncate">
                      {category}
                    </h3>
                    <span className="font-mono text-[11px] text-ink/35 ml-auto">
                      {sectionCards.length}
                    </span>
                  </div>

                  {sectionCards.length === 0 ? (
                    <p className="text-xs text-ink/35 px-3.5 py-3">
                      Drop a word here to move it into "{category}".
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2 p-3">
                      {sectionCards.map((card) => (
                        <WordCard
                          key={card.id}
                          card={card}
                          onUpdateCard={onUpdateCard}
                          isDragging={draggingCardId === card.id}
                          onDragStart={handleCardDragStart}
                          onDragEnd={handleCardDragEnd}
                        />
                      ))}
                    </ul>
                  )}
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
    </div>
  );
}

function cardOwningCategory(cards, cardId) {
  return cards.find((c) => c.id === cardId)?.category;
}
