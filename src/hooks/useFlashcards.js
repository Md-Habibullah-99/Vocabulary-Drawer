/**
 * useFlashcards.js
 * -----------------
 * Central state manager for the whole app. Wrapping this in a custom
 * hook (rather than spreading useState calls across App.jsx) keeps the
 * "marking engine" — the logic that updates a card's status and persists
 * it — in exactly one place, and makes App.jsx read like a layout
 * component instead of a state-management component.
 */

import { useState, useEffect, useCallback } from "react";
import { loadCards, saveCards, loadSettings, saveSettings } from "../utils/storage";

export function useFlashcards() {
  // Lazy initializers so localStorage is only read once, on first mount.
  const [cards, setCards] = useState(() => loadCards());
  const [settings, setSettings] = useState(() => loadSettings());

  // Persist cards any time they change. This is the single write path —
  // every status update, import, or reset goes through setCards, so a
  // single effect here is enough to keep localStorage in sync.
  useEffect(() => {
    saveCards(cards);
  }, [cards]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  /**
   * Replaces the entire deck — used when a new vocabulary text block is
   * parsed and imported. Existing progress is intentionally cleared
   * here because the imported cards are a new id space; callers that
   * want to *merge* instead of replace should do so before calling this.
   */
  const importCards = useCallback((newCards) => {
    setCards(newCards);
  }, []);

  /**
   * The marking engine. Updates a single card's status by id. Because
   * every sub-category view (Difficult/Easy/Favorite/Done, in both the
   * main category and "All Words") is just a filter over `cards` (see
   * utils/categoryTree.js), this one update is all that's needed for
   * the change to "instantly reflect" everywhere the brief asks for.
   */
  const setCardStatus = useCallback((cardId, status) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? { ...card, status: card.status === status ? "unmarked" : status }
          : card
      )
    );
  }, []);

  /** Updates a single settings flag (resetMeaningOnNavigation, etc). */
  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** Wipes all cards and resets settings to defaults — used by the Reset Data control. */
  const resetAll = useCallback(() => {
    setCards([]);
  }, []);

  return {
    cards,
    settings,
    importCards,
    setCardStatus,
    updateSetting,
    resetAll,
  };
}
