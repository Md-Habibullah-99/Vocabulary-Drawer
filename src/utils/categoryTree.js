/**
 * categoryTree.js
 * ----------------
 * Derives the full navigation structure (categories -> status sub-views)
 * from the single flat `cards` array. We deliberately do NOT store a
 * separate nested tree in state: the cards array is the single source
 * of truth, and the tree + every filtered card list is recomputed from
 * it. This guarantees a status change on one card can never get out of
 * sync between "Main Category -> Difficult" and "All Words -> Difficult" —
 * there's only one underlying fact (the card's `status` field), and every
 * view is just a filter over it.
 */

export const STATUS_FILTERS = ["all", "difficult", "easy", "favorite", "done"];

export const ALL_WORDS_CATEGORY = "All Words";

const STATUS_LABELS = {
  all: "All",
  difficult: "Difficult",
  easy: "Easy",
  favorite: "Favorite",
  done: "Done",
};

export function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

/**
 * Returns an ordered list of category names as they first appear in the
 * card array, with "All Words" pinned to the front. Using first-seen
 * order (rather than alphabetical) keeps categories in the same order
 * they appeared in the source document, which matches how a learner
 * paced through their material.
 */
export function getCategoryList(cards) {
  const seen = [];
  for (const card of cards) {
    if (!seen.includes(card.category)) {
      seen.push(card.category);
    }
  }
  return [ALL_WORDS_CATEGORY, ...seen];
}

/**
 * Returns the cards belonging to a given category. "All Words" returns
 * every card regardless of category.
 */
export function getCardsForCategory(cards, category) {
  if (category === ALL_WORDS_CATEGORY) return cards;
  return cards.filter((c) => c.category === category);
}

/**
 * Applies a status sub-category filter on top of a category's cards.
 * 'all' returns the category's full list unfiltered.
 */
export function filterByStatus(cards, status) {
  if (status === "all") return cards;
  return cards.filter((c) => c.status === status);
}

/**
 * Convenience combined selector: given the full card list, a selected
 * category, and a selected status filter, returns the exact deck the
 * flashcard viewer should show.
 */
export function getActiveDeck(cards, category, status) {
  const categoryCards = getCardsForCategory(cards, category);
  return filterByStatus(categoryCards, status);
}

/**
 * Counts cards per status within a category — used to show badge counts
 * in the sidebar (e.g. "Difficult (4)") so learners can see progress
 * without opening each sub-category.
 */
export function getStatusCounts(cards, category) {
  const categoryCards = getCardsForCategory(cards, category);
  const counts = { all: categoryCards.length };
  for (const status of STATUS_FILTERS) {
    if (status === "all") continue;
    counts[status] = categoryCards.filter((c) => c.status === status).length;
  }
  return counts;
}
