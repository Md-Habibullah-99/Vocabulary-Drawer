/**
 * HomeView.jsx
 * -------------
 * The "/" route's content: category/tag Sidebar on the side, the
 * active Flashcard + DeckControls in the middle. Pure presentation —
 * all state and handlers are owned by App.jsx and passed in as props,
 * same division of responsibility App.jsx already used before routing
 * was introduced, just now split into its own file so it can be
 * plugged in as a <Route element>.
 */

import React from "react";
import Sidebar from "./Sidebar";
import Flashcard from "./Flashcard";
import DeckControls from "./DeckControls";
import { useSwipeGesture } from "../hooks/useSwipeGesture";

export default function HomeView({
  isSidebarOpen,
  onRequestCloseSidebar,
  categories,
  activeCategory,
  activeTag,
  onSelectCategory,
  getCounts,
  tags,
  onMergeCategory,
  onAddTag,
  onRenameTag,
  onDeleteTag,
  currentCard,
  isRevealed,
  onToggleReveal,
  onToggleTag,
  currentIndex,
  deckLength,
  onPrevious,
  onNext,
}) {
  // Feature: swipe left/right to navigate the deck on touch devices.
  // Swipe left (finger moves right-to-left) -> next word, mirroring
  // DeckControls' "Next" button; swipe right -> previous word. The ref
  // is attached to the <main> below, so a swipe anywhere over the
  // flashcard + controls area triggers it, not just on the card itself.
  const swipeRef = useSwipeGesture({ onSwipeLeft: onNext, onSwipeRight: onPrevious });

  return (
    <div className="relative flex flex-1 min-h-0 flex-col md:flex-row md:overflow-hidden">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onRequestCloseSidebar}
          className="fixed inset-0 z-30 bg-ink/25 backdrop-blur-[1px] md:hidden"
        />
      )}
      <Sidebar
        categories={categories}
        activeCategory={activeCategory}
        activeTag={activeTag}
        onSelect={onSelectCategory}
        getCounts={getCounts}
        tags={tags}
        onMergeCategory={onMergeCategory}
        onAddTag={onAddTag}
        onRenameTag={onRenameTag}
        onDeleteTag={onDeleteTag}
        isMobileOpen={isSidebarOpen}
        onRequestClose={onRequestCloseSidebar}
      />

      <main
        ref={swipeRef}
        className="flex-1 min-h-0 flex items-center justify-center px-6 py-10 md:overflow-hidden"
        style={{ touchAction: "pan-y" }}
      >
        <div className="w-full max-w-md">
          <Flashcard
            card={currentCard}
            tags={tags}
            isRevealed={isRevealed}
            onToggleReveal={onToggleReveal}
            onToggleTag={onToggleTag}
          />
          <DeckControls
            currentIndex={currentIndex}
            deckLength={deckLength}
            onPrevious={onPrevious}
            onNext={onNext}
          />
          <p className="hidden lg:block text-center font-mono text-[11px] text-ink/30 mt-3">
            Space to flip &middot; ← → to navigate
          </p>
        </div>
      </main>
    </div>
  );
}
