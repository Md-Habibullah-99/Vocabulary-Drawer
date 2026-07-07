/**
 * App.jsx
 * --------
 * Top-level layout, routing, and state wiring. Deliberately thin: all
 * persistence and marking logic lives in hooks/useFlashcards.js, all
 * category/tag filtering logic lives in utils/categoryTree.js, and all
 * deck-position logic lives in hooks/useDeckNavigation.js. This file's
 * job is to connect those pieces to the visual components and routes,
 * plus the global keyboard shortcuts (Space to flip, arrows to
 * navigate).
 *
 * ROUTES
 * -------
 *  "/"          — Home: Sidebar + Flashcard + DeckControls. Redirects
 *                 to "/add-words" if there are no cards yet (nothing
 *                 to show).
 *  "/add-words" — ImportPanel, with a "Back to flashcards" button so
 *                 a learner who opened it by mistake (or just changed
 *                 their mind) can always get back to "/" without
 *                 getting stuck — see ImportPanel's onCancel prop.
 *  "/manage"    — ManagePage: add a single word via a dedicated form,
 *                 drag a word onto a different category to move just
 *                 that card, or drag a category's header onto another
 *                 category to merge them (same interaction as the
 *                 Sidebar, via useCategoryMergeDrag). Available even
 *                 with zero existing cards, unlike "/".
 *
 * DuplicateReviewPanel and SettingsPanel are NOT routes: they're
 * transient overlays that can appear regardless of which route is
 * active (a duplicate check can be triggered from either ImportPanel
 * or a Settings backup-restore), so they're rendered as siblings of
 * <Routes> rather than as routes themselves. While DuplicateReviewPanel
 * is showing, the routed content underneath is hidden (not unmounted)
 * so an in-progress ImportPanel form isn't lost if the learner cancels
 * the review.
 */

import React, { useState, useMemo, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import { Menu, Settings as SettingsIcon, Plus, FolderCog } from "lucide-react";

import HomeView from "./components/HomeView";
import SettingsPanel from "./components/SettingsPanel";
import ImportPanel from "./components/ImportPanel";
import DuplicateReviewPanel from "./components/DuplicateReviewPanel";
import ManagePage from "./components/ManagePage";

import { useFlashcards } from "./hooks/useFlashcards";
import { useDeckNavigation } from "./hooks/useDeckNavigation";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import {
  getCategoryList,
  getActiveDeck,
  getTagCounts,
  ALL_WORDS_CATEGORY,
} from "./utils/categoryTree";

export default function App() {
  const {
    cards,
    settings,
    tags,
    formatProfiles,
    history,
    importCards,
    addCards,
    restoreCards,
    checkForDuplicates,
    toggleTag,
    updateCard,
    updateSetting,
    resetAll,
    addCard,
    moveCardToCategory,
    mergeCategory,
    deleteCategoryCards,
    deleteCard,
    addCustomTag,
    renameTag,
    deleteCustomTag,
    saveFormatProfile,
    deleteFormatProfile,
    recordView,
    clearHistory,
  } = useFlashcards();

  const navigate = useNavigate();
  const location = useLocation();
  const isAddWordsRoute = location.pathname === "/add-words";
  const isManageRoute = location.pathname === "/manage";
  const isHomeRoute = location.pathname === "/";

  const [activeCategory, setActiveCategory] = useState(ALL_WORDS_CATEGORY);
  const [activeTag, setActiveTag] = useState("all");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Set whenever a parsed/restored batch has one or more duplicates
  // (by word+meaning) against the existing deck: { cards, mode }, where
  // mode is 'import' (came from ImportPanel, uses addCards/importCards
  // on confirm) or 'restore' (came from a Settings backup upload, uses
  // restoreCards on confirm so tags get re-created too). While this is
  // set, DuplicateReviewPanel replaces whatever route would otherwise
  // be showing, so the learner resolves duplicates before anything
  // commits.
  const [pendingImport, setPendingImport] = useState(null);
  const showDuplicateReview = !!pendingImport;

  useEffect(() => {
    if (!isHomeRoute || showDuplicateReview) {
      setIsSidebarOpen(false);
    }
  }, [isHomeRoute, showDuplicateReview]);

  const categories = useMemo(() => getCategoryList(cards), [cards]);

  const activeDeck = useMemo(
    () => getActiveDeck(cards, activeCategory, activeTag),
    [cards, activeCategory, activeTag]
  );

  const deckKey = `${activeCategory}::${activeTag}`;

  const {
    currentCard,
    currentIndex,
    deckLength,
    isRevealed,
    goNext,
    goPrevious,
    toggleReveal,
  } = useDeckNavigation(activeDeck, deckKey, settings.shuffleMode, settings.resetMeaningOnNavigation);

  // Log every card that becomes the active one in the deck viewer, so
  // "recently viewed" always reflects what the learner actually looked
  // at — independent of which category/tag filter they were browsing
  // through to get there. Keyed on the card's id so flipping/marking
  // the SAME card doesn't re-log it; only actually navigating to a
  // different card does.
  useEffect(() => {
    if (currentCard) recordView(currentCard);
  }, [currentCard?.id, recordView]);

  const handleSelectCategory = (category, tagId) => {
    setActiveCategory(category);
    setActiveTag(tagId);
  };

  const handleToggleTag = (tagId) => {
    if (currentCard) toggleTag(currentCard.id, tagId);
  };

  const getCounts = (category) => getTagCounts(cards, category, tags);

  const hasExistingCards = cards.length > 0;

  /**
   * Entry point for BOTH the ImportPanel ("Add words" / first import)
   * and the Settings backup-restore upload. Runs duplicate detection
   * up front: if nothing duplicates, commit immediately (no extra
   * friction for the common case); if anything does, hold the batch in
   * `pendingImport` and show DuplicateReviewPanel so the learner
   * decides what to do BEFORE it touches state.
   */
  const handleIncomingCards = (newCards, mode) => {
    const { duplicates, unique } = checkForDuplicates(newCards);

    if (duplicates.length === 0) {
      commitCards(newCards, mode);
      return;
    }

    setPendingImport({ cards: newCards, duplicates, unique, mode });
  };

  /** Actually writes a batch of cards to state, via the right path for the mode, then returns the learner to their flashcards. */
  const commitCards = (cardsToCommit, mode) => {
    if (mode === "restore") {
      restoreCards(cardsToCommit);
    } else if (hasExistingCards) {
      addCards(cardsToCommit);
    } else {
      importCards(cardsToCommit);
    }
    setActiveCategory(ALL_WORDS_CATEGORY);
    setActiveTag("all");
    navigate("/");
  };

  const handleConfirmDuplicateReview = (skipIds) => {
    const { cards: allParsedCards, mode } = pendingImport;
    const cardsToCommit = allParsedCards.filter((c) => !skipIds.has(c.id));
    commitCards(cardsToCommit, mode);
    setPendingImport(null);
  };

  const handleCancelDuplicateReview = () => {
    setPendingImport(null);
  };

  // Keyboard shortcuts are only live while the study view (not an
  // import/settings panel) is showing, so typing in the import textarea
  // or a sidebar rename field never gets hijacked by Space/arrow keys.
  useKeyboardShortcuts({
    onFlip: toggleReveal,
    onNext: goNext,
    onPrevious: goPrevious,
    enabled: !isAddWordsRoute && !isManageRoute && !showDuplicateReview && !isSettingsOpen,
  });

  return (
    <div className="paper-texture min-h-screen md:h-screen md:overflow-hidden flex flex-col font-body">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-rule bg-paper">
        <div className="flex items-center gap-2">
          {isHomeRoute && !showDuplicateReview && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar"
              className="md:hidden p-2 -ml-1 rounded-sm border border-rule text-ink/70 hover:border-ink/40 transition-colors"
            >
              <Menu size={16} />
            </button>
          )}
          <Link to="/">
            <span className="font-display font-semibold text-lg text-ink">
              Vocabulary Drawer
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {!isAddWordsRoute && !showDuplicateReview && (
            <button
              type="button"
              onClick={() => navigate("/add-words")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-rule text-ink/70 text-sm hover:border-ink/40 transition-colors"
            >
              <Plus size={15} />
              Add words
            </button>
          )}
          {!isManageRoute && !showDuplicateReview && (
            <button
              type="button"
              onClick={() => navigate("/manage")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-rule text-ink/70 text-sm hover:border-ink/40 transition-colors"
            >
              <FolderCog size={15} />
              Manage
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Open settings"
            className="p-2 rounded-sm border border-rule text-ink/70 hover:border-ink/40 transition-colors"
          >
            <SettingsIcon size={16} />
          </button>
        </div>
      </header>

      {/* Routed content stays MOUNTED (just hidden) while duplicate
          review is showing on top of it, rather than being unmounted —
          otherwise cancelling the review would wipe whatever text/format
          the learner had set up in the ImportPanel form, forcing them to
          redo it. */}
      <div className={`flex flex-1 min-h-0 flex-col ${showDuplicateReview ? "hidden" : ""}`}>
        <Routes>
          <Route
            path="/"
            element={
              hasExistingCards ? (
                <HomeView
                  isSidebarOpen={isSidebarOpen}
                  onRequestCloseSidebar={() => setIsSidebarOpen(false)}
                  categories={categories}
                  activeCategory={activeCategory}
                  activeTag={activeTag}
                  onSelectCategory={handleSelectCategory}
                  getCounts={getCounts}
                  tags={tags}
                  onMergeCategory={mergeCategory}
                  onAddTag={addCustomTag}
                  onRenameTag={renameTag}
                  onDeleteTag={deleteCustomTag}
                  currentCard={currentCard}
                  isRevealed={isRevealed}
                  onToggleReveal={toggleReveal}
                  onToggleTag={handleToggleTag}
                  currentIndex={currentIndex}
                  deckLength={deckLength}
                  onPrevious={goPrevious}
                  onNext={goNext}
                />
              ) : (
                <Navigate to="/add-words" replace />
              )
            }
          />
          <Route
            path="/add-words"
            element={
              <div className="flex-1 min-h-0 overflow-y-auto">
                <ImportPanel
                  formatProfiles={formatProfiles}
                  onSaveFormatProfile={saveFormatProfile}
                  onDeleteFormatProfile={deleteFormatProfile}
                  onImport={(newCards) => handleIncomingCards(newCards, "import")}
                  onCancel={hasExistingCards ? () => navigate("/") : null}
                />
              </div>
            }
          />
          <Route
            path="/manage"
            element={
              <ManagePage
                cards={cards}
                onAddCard={addCard}
                onUpdateCard={updateCard}
                onMoveCardToCategory={moveCardToCategory}
                onMergeCategory={mergeCategory}
                onDeleteCategoryCards={deleteCategoryCards}
                onDeleteCard={deleteCard}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {showDuplicateReview && (
        <main className="flex-1">
          <DuplicateReviewPanel
            duplicates={pendingImport.duplicates}
            uniqueCount={pendingImport.unique.length}
            onConfirm={handleConfirmDuplicateReview}
            onCancel={handleCancelDuplicateReview}
          />
        </main>
      )}

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSetting={updateSetting}
        onResetData={() => {
          resetAll();
          setIsSettingsOpen(false);
          navigate("/add-words");
        }}
        cards={cards}
        categories={categories}
        tags={tags}
        history={history}
        onClearHistory={clearHistory}
        onUpdateCard={updateCard}
        onRestoreBackup={(restoredCards) => {
          setIsSettingsOpen(false);
          handleIncomingCards(restoredCards, "restore");
        }}
      />
    </div>
  );
}
