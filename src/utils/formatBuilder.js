/**
 * formatBuilder.js
 * ----------------
 * Powers the "Drag & Drop" format-builder tab in ImportPanel. The
 * builder zone (components/FormatBuilder.jsx) lets a learner mix
 * draggable field chips with freely-typed characters to visually
 * construct a record shape, e.g.:
 *
 *   [word]  " : "  [meaning]  "\n"  [example]  "."  [meaning of example]
 *
 * This file turns that sequence of chip/text tokens into the exact
 * same {mode:'regex', pattern, flags} shape formatProfiles.js already
 * knows how to run (parseWithCustomRegex) — so, like easyFormatBuilder.js,
 * this is purely a friendlier front end and NOT a second parsing
 * implementation to keep in sync.
 *
 * TOKEN SHAPE
 * -----------
 * A "token" is either:
 *   { type: "text", value: string }              — literal typed characters
 *   { type: "chip", id: string, field: string }   — a dropped/inserted chip
 *
 * `field` is one of FORMAT_FIELDS[].id below. `digit` is special: it is
 * NOT captured into a named group (it exists purely so learners can
 * skip over a numbering prefix like "21." without it polluting the
 * word field), so it has `group: null`.
 */

/** The 5 draggable chip definitions, in the order they're offered. */
export const FORMAT_FIELDS = [
  {
    id: "digit",
    label: "digit or \\d",
    display: "[digit or \\d]",
    group: null,
    color: "ink",
    description: "Matches one or more digits (e.g. a numbering prefix). Not captured as a field.",
  },
  {
    id: "word",
    label: "word",
    display: "[word]",
    group: "word",
    color: "accent",
    description: "The vocabulary word or phrase.",
  },
  {
    id: "meaning",
    label: "meaning",
    display: "[meaning]",
    group: "meaning",
    color: "sage",
    description: "The word's translation/definition.",
  },
  {
    id: "example",
    label: "example",
    display: "[example]",
    group: "example",
    color: "brass",
    description: "An example sentence using the word.",
  },
  {
    id: "meaningOfExample",
    label: "meaning of example",
    display: "[meaning of example]",
    group: "exampleMeaning",
    color: "teal",
    description: "The example sentence's translation.",
  },
];

export const FIELD_BY_ID = Object.fromEntries(FORMAT_FIELDS.map((f) => [f.id, f]));

/** Escapes regex special characters in literal typed text (leaves a literal "\n" character alone — it's meaningful, not something to escape). */
function escapeRegexLiteral(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Collapses adjacent { type: "text" } tokens into one (can happen after
 * chip removal) and drops any empty text tokens, so downstream logic
 * doesn't have to special-case them.
 */
function normalizeTokens(tokens) {
  const out = [];
  for (const t of tokens) {
    if (t.type === "text") {
      if (t.value === "") continue;
      const prev = out[out.length - 1];
      if (prev && prev.type === "text") {
        prev.value += t.value;
        continue;
      }
    }
    out.push({ ...t });
  }
  return out;
}

/**
 * Converts a token sequence into a regex pattern string with named
 * groups, plus a human-readable one-line description for the format
 * summary row.
 *
 * Capture strategy for each chip:
 *  - If it's immediately followed by a literal text token, the group
 *    is LAZY (`.+?`) so it stops at the first occurrence of that
 *    literal text — this is what lets "[word] : [meaning]" correctly
 *    split on the FIRST colon rather than swallowing everything.
 *  - If it's at the end of the sequence (or immediately followed by
 *    another chip, with nothing to anchor against), the group is
 *    GREEDY (`.+`) — since `.` never matches a newline by default,
 *    greedy still stops naturally at the end of the line.
 *
 * @param {Array<{type:'text',value:string}|{type:'chip',field:string}>} tokens
 * @returns {{ pattern: string, flags: string, description: string, groupsUsed: string[] }}
 */
export function tokensToPattern(tokens) {
  const clean = normalizeTokens(tokens);

  if (clean.length === 0) {
    return { pattern: "", flags: "gm", description: "", groupsUsed: [] };
  }

  let pattern = "";
  let description = "";
  const groupsUsed = [];
  const seenGroups = new Set();

  for (let i = 0; i < clean.length; i++) {
    const token = clean[i];

    if (token.type === "text") {
      pattern += escapeRegexLiteral(token.value);
      description += token.value === "\n" ? " ⏎ " : token.value;
      continue;
    }

    // token.type === "chip"
    const field = FIELD_BY_ID[token.field];
    if (!field) continue;

    if (field.group === null) {
      // Structural-only chip (currently just "digit") — consumed but not captured.
      pattern += "\\d+";
      description += field.display;
      continue;
    }

    if (seenGroups.has(field.group)) {
      // A field used twice would create an invalid duplicate named
      // group; silently skip the repeat rather than throwing, so the
      // learner isn't blocked mid-edit — validation surfaces instead
      // via "no matches" in the live preview.
      description += field.display;
      continue;
    }
    seenGroups.add(field.group);
    groupsUsed.push(field.group);

    const next = clean[i + 1];
    const isLazy = next && next.type === "text" && next.value.length > 0;
    pattern += `(?<${field.group}>${isLazy ? ".+?" : ".+"})`;
    description += field.display;
  }

  return { pattern, flags: "gm", description, groupsUsed };
}

/**
 * Quick validity check used to decide whether the builder's current
 * arrangement is usable as an import format at all: it must contain at
 * least a `word` and a `meaning` chip (matching the minimum requirement
 * of the Advanced/regex mode this builder feeds into).
 */
export function isPatternUsable(groupsUsed) {
  return groupsUsed.includes("word") && groupsUsed.includes("meaning");
}
