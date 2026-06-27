/**
 * storage.js
 * ----------
 * Thin wrapper around localStorage so the rest of the app never touches
 * `window.localStorage` directly. Centralizing this means:
 *  - Key names live in one place (no typos across components).
 *  - JSON parse/stringify errors are caught in one place.
 *  - Swapping persistence strategy later (e.g. IndexedDB) only touches
 *    this file.
 */

const KEYS = {
  CARDS: "flashcards.cards.v1",
  SETTINGS: "flashcards.settings.v1",
};

/** Default settings used the very first time the app loads. */
export const DEFAULT_SETTINGS = {
  resetMeaningOnNavigation: true,
  audioEnabled: false, // placeholder flag for future text-to-speech
  shuffleMode: false,
};

function safeParse(rawValue, fallback) {
  if (rawValue === null) return fallback;
  try {
    return JSON.parse(rawValue);
  } catch (err) {
    console.warn("Failed to parse stored value, using fallback.", err);
    return fallback;
  }
}

export function loadCards() {
  return safeParse(localStorage.getItem(KEYS.CARDS), []);
}

export function saveCards(cards) {
  try {
    localStorage.setItem(KEYS.CARDS, JSON.stringify(cards));
  } catch (err) {
    // Most likely a quota error — surfaced to console rather than
    // crashing the app, since losing persistence isn't fatal mid-session.
    console.error("Failed to save cards to localStorage.", err);
  }
}

export function loadSettings() {
  return safeParse(localStorage.getItem(KEYS.SETTINGS), DEFAULT_SETTINGS);
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save settings to localStorage.", err);
  }
}

export function clearAllData() {
  localStorage.removeItem(KEYS.CARDS);
  localStorage.removeItem(KEYS.SETTINGS);
}
