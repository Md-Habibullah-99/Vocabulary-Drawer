# Vocabulary Drawer — PDF-to-Flashcard Generator

A fully client-side flashcard app for language learners. No backend, no
API calls — vocabulary text is parsed in the browser (or ahead of time
with the included Python script), and all progress is saved to
`localStorage`.

## Setup

```bash
npm install
npm run dev      # local dev server
npm run build    # production build -> dist/
```

## Project structure

```
parser.py                      Standalone Python parser (text -> JSON)
src/
  utils/
    textParser.js               Client-side parser (same logic as parser.py)
    categoryTree.js              Derives categories + status filters from the flat card array
    storage.js                   localStorage read/write wrapper
  hooks/
    useFlashcards.js             Card data + marking engine + persistence
    useDeckNavigation.js         Active deck position, shuffle, reveal-reset
  components/
    Sidebar.jsx                  Category "drawer" + status sub-filters with live counts
    Flashcard.jsx                The interactive index-card (click-to-flip, status buttons)
    DeckControls.jsx             Previous / Next navigation
    SettingsPanel.jsx            Slide-in settings drawer
    ImportPanel.jsx              Paste/import vocabulary text
  App.jsx                        Layout + wiring between the above
  main.jsx, index.css            Entry point + design tokens / global styles
tailwind.config.js               Color palette (paper/ink/rule/accent/sage/brass) + fonts
```

## How the data flows

1. **Parsing** (`textParser.js` or `parser.py`) turns raw text into a flat
   array of card objects: `{ id, category, word, meaning, example, exampleMeaning, status }`.
2. **`categoryTree.js`** is the only place that knows how to turn that flat
   array into a navigable tree (categories → All/Difficult/Easy/Favorite/Done).
   There is no separately-stored nested tree — every view is a filter over
   the same array, which is what makes status updates appear consistently
   everywhere (e.g. a card marked "Difficult" instantly shows up under both
   its own category's Difficult view *and* "All Words → Difficult").
3. **`useFlashcards.js`** owns the card array and settings, persists both to
   `localStorage` on every change, and exposes `setCardStatus` as the single
   write path for marking a card.
4. **`useDeckNavigation.js`** owns *where you are* in the currently filtered
   deck — separate from the data itself, since it needs to reset/reshuffle
   whenever you switch categories without touching the underlying cards.

## Using the Python parser instead

If you'd rather pre-process a large vocabulary file outside the browser:

```bash
python parser.py input.txt output.json
```

Then paste the resulting JSON's source `.txt` into the in-app import screen,
or adapt `ImportPanel.jsx` to accept a `.json` file directly if you've
already parsed it.

## Design notes

The visual language is a "card-catalog drawer": warm paper tones, a serif
(Fraunces) for the headword like a printed dictionary entry, monospace
(IBM Plex Mono) for catalog-style metadata, and a die-cut corner notch +
3D flip on the flashcard itself as the one deliberate signature flourish.
Colors and fonts are defined as tokens in `tailwind.config.js` — change
them there to retheme the whole app.
