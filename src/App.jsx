/**
 * App.jsx
 * --------
 * Top-level layout and state wiring. Deliberately thin: all persistence
 * and marking logic lives in hooks/useFlashcards.js, all category/status
 * filtering logic lives in utils/categoryTree.js, and all deck-position
 * logic lives in hooks/useDeckNavigation.js. This file's only job is to
 * connect those pieces to the visual components.
 *
 * View states:
 *  1. Import view — shown when there are no cards yet.
 *  2. Study view — sidebar (categories/status) + active flashcard + controls.
 */

import React, { useState, useMemo } from "react";
import { Settings as SettingsIcon, Plus } from "lucide-react";

import Sidebar from "./components/Sidebar";
import Flashcard from "./components/Flashcard";
import DeckControls from "./components/DeckControls";
import SettingsPanel from "./components/SettingsPanel";
import ImportPanel from "./components/ImportPanel";

import { useFlashcards } from "./hooks/useFlashcards";
import { useDeckNavigation } from "./hooks/useDeckNavigation";
import {
  getCategoryList,
  getActiveDeck,
  getStatusCounts,
  ALL_WORDS_CATEGORY,
} from "./utils/categoryTree";

export default function App() {
  const { cards, settings, importCards, setCardStatus, updateSetting, resetAll } =
    useFlashcards();

  const [activeCategory, setActiveCategory] = useState(ALL_WORDS_CATEGORY);
  const [activeStatus, setActiveStatus] = useState("all");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const categories = useMemo(() => getCategoryList(cards), [cards]);

  const activeDeck = useMemo(
    () => getActiveDeck(cards, activeCategory, activeStatus),
    [cards, activeCategory, activeStatus]
  );

  const deckKey = `${activeCategory}::${activeStatus}`;

  const {
    currentCard,
    currentIndex,
    deckLength,
    isRevealed,
    goNext,
    goPrevious,
    toggleReveal,
  } = useDeckNavigation(
    activeDeck,
    deckKey,
    settings.shuffleMode,
    settings.resetMeaningOnNavigation
  );

  const handleSelectCategory = (category, status) => {
    setActiveCategory(category);
    setActiveStatus(status);
  };

  const handleSetStatus = (status) => {
    if (currentCard) setCardStatus(currentCard.id, status);
  };

  const getCounts = (category) => getStatusCounts(cards, category);

  const showImportView = cards.length === 0 || isImporting;

  return (
    <div className="paper-texture min-h-screen flex flex-col font-body">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-rule bg-paper">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-lg text-ink">
            Vocabulary Drawer
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!showImportView && (
            <button
              type="button"
              onClick={() => setIsImporting(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-rule text-ink/70 text-sm hover:border-ink/40 transition-colors"
            >
              <Plus size={15} />
              Add words
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

      {showImportView ? (
        <main className="flex-1">
          <ImportPanel
            onImport={(newCards) => {
              importCards(newCards);
              setActiveCategory(ALL_WORDS_CATEGORY);
              setActiveStatus("all");
              setIsImporting(false);
            }}
          />
        </main>
      ) : (
        <div className="flex flex-1 flex-col md:flex-row">
          <Sidebar
            categories={categories}
            activeCategory={activeCategory}
            activeStatus={activeStatus}
            onSelect={handleSelectCategory}
            getCounts={getCounts}
          />

          <main className="flex-1 flex items-center justify-center px-6 py-10">
            <div className="w-full max-w-md">
              <Flashcard
                card={currentCard}
                isRevealed={isRevealed}
                onToggleReveal={toggleReveal}
                onSetStatus={handleSetStatus}
              />
              <DeckControls
                currentIndex={currentIndex}
                deckLength={deckLength}
                onPrevious={goPrevious}
                onNext={goNext}
              />
            </div>
          </main>
        </div>
      )}

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSetting={updateSetting}
        onResetData={() => {
          resetAll();
          setIsSettingsOpen(false);
          setIsImporting(true);
        }}
      />
    </div>
  );
}
