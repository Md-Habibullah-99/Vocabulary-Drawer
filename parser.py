"""
parser.py
---------
Converts a raw, line-structured vocabulary text file into a structured
JSON array of flashcard objects, grouped by category.

INPUT FORMAT
------------
A category header is any non-empty line that does NOT start with a number
followed by a period (e.g. "21."). Everything else comes in two-line pairs:

    BASIC TURKISH NOUNS AND ADJECTIVES      <- category header
    21. Evet Yes                            <- "<num>. <word> <meaning>"
    Evet, biliyorum. Yes, I know.            <- "<example>. <example meaning>."

Blank lines are ignored. A new category header simply replaces the
"current category" for every entry that follows it, until the next header.

OUTPUT FORMAT
-------------
A flat JSON array. Each item:
{
  "id": "card-0001",
  "category": "BASIC TURKISH NOUNS AND ADJECTIVES",
  "word": "Evet",
  "meaning": "Yes",
  "example": "Evet, biliyorum.",
  "exampleMeaning": "Yes, I know.",
  "status": "unmarked"
}

This flat structure is intentional: the React app derives the category
tree, "All Words" view, and status sub-categories (Difficult / Easy /
Favorite / Done) at render time by filtering this single array, rather
than maintaining duplicated nested copies of the same cards.

USAGE
-----
    python parser.py input.txt output.json
"""

import json
import re
import sys
from typing import List, Dict, Optional


# A line counts as a "header" line if it is NOT a numbered entry line.
# Numbered entry lines look like: "21. Evet Yes" or "104. Kelime Word"
NUMBERED_LINE_RE = re.compile(r"^\s*\d+\.\s+(.*)$")

# Splits a numbered line's remainder into (word, meaning).
# Assumption: the target-language word is the FIRST token/phrase, and the
# rest of the line is the English meaning. Because vocab words are usually
# a single word, we treat the first whitespace-separated token as the word
# and the remainder as the meaning. If your source has multi-word target
# terms, see `split_word_meaning` below for the tunable strategy.
def split_word_meaning(remainder: str) -> (str, str):
    """
    Splits "Evet Yes" -> ("Evet", "Yes").
    Splits "Hayır No" -> ("Hayır", "No").

    Strategy: first word = target-language term, rest = meaning.
    This matches the example format given (single-word vocab items).
    If a word genuinely has two tokens (e.g. "Iyi misin"), prefer adjusting
    the source text to separate word/meaning with a delimiter like a tab
    or double-space, and switch this function to split on that instead.
    """
    remainder = remainder.strip()
    parts = remainder.split(" ", 1)
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()
    # Fallback: nothing to split on, treat whole thing as the word with
    # no meaning captured (better to surface an empty meaning than crash).
    return remainder, ""


def split_example_line(line: str) -> (str, str):
    """
    Splits "Evet, biliyorum. Yes, I know." into:
      ("Evet, biliyorum.", "Yes, I know.")

    Strategy: the example sentence in the target language ends at the
    FIRST sentence-ending punctuation (. ! ?) that is followed by a
    capital letter and more text (the translation). This is more robust
    than a naive split on the first period, since many sentences contain
    abbreviations or multiple clauses.
    """
    line = line.strip()
    match = re.search(r"([.!?])\s+(?=[A-ZÇĞİÖŞÜ])", line)
    if not match:
        # No clear split point found; return the whole line as the
        # example and leave the translation empty rather than guessing.
        return line, ""
    split_at = match.end(1)  # position right after the punctuation mark
    example = line[:split_at].strip()
    example_meaning = line[split_at:].strip()
    return example, example_meaning


def parse_vocabulary_text(raw_text: str) -> List[Dict]:
    """
    Main parsing entry point. Takes the full raw text and returns a list
    of flashcard dicts as described in the module docstring.
    """
    cards: List[Dict] = []
    current_category: Optional[str] = None
    pending_word: Optional[Dict] = None  # holds word/meaning until we see line 2
    card_counter = 0

    lines = raw_text.splitlines()

    for raw_line in lines:
        line = raw_line.strip()

        if not line:
            # Blank lines separate blocks but carry no data themselves.
            continue

        numbered_match = NUMBERED_LINE_RE.match(line)

        if numbered_match:
            # This is a "line 1" — number, word, meaning.
            if pending_word is not None:
                # The previous numbered line never received its example
                # line (malformed input). We still keep the card, just
                # with empty example fields, instead of silently dropping
                # the vocabulary item.
                cards.append(pending_word)
                pending_word = None

            word, meaning = split_word_meaning(numbered_match.group(1))
            card_counter += 1
            pending_word = {
                "id": f"card-{card_counter:04d}",
                "category": current_category or "Uncategorized",
                "word": word,
                "meaning": meaning,
                "example": "",
                "exampleMeaning": "",
                "status": "unmarked",
            }
            continue

        if pending_word is not None:
            # This is "line 2" — the example sentence pair for the word
            # we just captured above.
            example, example_meaning = split_example_line(line)
            pending_word["example"] = example
            pending_word["exampleMeaning"] = example_meaning
            cards.append(pending_word)
            pending_word = None
            continue

        # Not numbered, and no word is pending -> this is a category header.
        current_category = line

    # Flush any trailing pending word that never got an example line.
    if pending_word is not None:
        cards.append(pending_word)

    return cards


def main():
    if len(sys.argv) != 3:
        print("Usage: python parser.py <input.txt> <output.json>")
        sys.exit(1)

    input_path, output_path = sys.argv[1], sys.argv[2]

    with open(input_path, "r", encoding="utf-8") as f:
        raw_text = f.read()

    cards = parse_vocabulary_text(raw_text)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(cards, f, ensure_ascii=False, indent=2)

    print(f"Parsed {len(cards)} cards across "
          f"{len({c['category'] for c in cards})} categories -> {output_path}")


if __name__ == "__main__":
    main()
