/**
 * FormatBuilder.jsx
 * ------------------
 * The "Drag & Drop" format-builder tab in ImportPanel's format
 * selector. Lets a learner construct a custom record shape by BOTH
 * dragging field chips into a work area AND typing separator
 * characters freely with their keyboard — e.g. drag [word], type
 * " : ", drag [meaning], press Enter, drag [example], type ".", drag
 * [meaning of example].
 *
 * IMPLEMENTATION NOTE — why a "cleverly managed contentEditable div"
 * instead of a drag library:
 *   The interaction needs precise CURSOR-POSITION insertion (a chip
 *   dropped or clicked mid-sentence must land exactly where the caret
 *   is, next to freely-typed text) — that's a text-editing problem
 *   first and a drag-reordering problem second. Libraries like
 *   @dnd-kit/core or react-beautiful-dnd are built for reordering
 *   discrete list items, not for merging drag targets into a live
 *   text caret, so using one here would mean fighting the library as
 *   much as using it. The native HTML5 Drag and Drop API plus a
 *   ref-managed contentEditable div gets caret-accurate insertion for
 *   free via document.caretRangeFromPoint, with zero new dependencies.
 *
 *   For accessibility and touch devices (native HTML5 drag support on
 *   mobile is poor), every chip is ALSO a plain click target: clicking
 *   a chip inserts it at the last known cursor position (or the end,
 *   if the field has never been focused yet). This makes the whole
 *   thing usable with just a mouse/tap and keyboard, no drag required.
 *
 *   If a future version needs multi-zone drag reordering with full
 *   keyboard-drag accessibility, @dnd-kit/core would be the
 *   recommendation then — it's the right tool for THAT problem.
 *
 * The contentEditable div is intentionally UNCONTROLLED: React never
 * re-renders its innerHTML from state (that's what causes the classic
 * "cursor jumps to the start" bug). Chips are inserted imperatively via
 * DOM Range APIs, plain typing is left entirely to the browser, and we
 * only READ the DOM (via a ref) to derive the token list whenever
 * something changes, purely to build the regex pattern for the parent.
 *
 * Props:
 *  - onPatternChange: (pattern: string, flags: string, description: string, usable: boolean) => void
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { FORMAT_FIELDS, FIELD_BY_ID, tokensToPattern, isPatternUsable } from "../utils/formatBuilder";

const COLOR_CLASSES = {
  accent: {
    chip: "bg-accent/10 border-accent text-accent hover:bg-accent/20",
    token: "bg-accent/15 text-accent border-accent/40",
  },
  sage: {
    chip: "bg-sage/10 border-sage text-sage hover:bg-sage/20",
    token: "bg-sage/15 text-sage border-sage/40",
  },
  brass: {
    chip: "bg-brass/10 border-brass text-brass hover:bg-brass/20",
    token: "bg-brass/15 text-brass border-brass/40",
  },
  teal: {
    chip: "bg-teal/10 border-teal text-teal hover:bg-teal/20",
    token: "bg-teal/15 text-teal border-teal/40",
  },
  ink: {
    chip: "bg-ink/5 border-ink/30 text-ink/70 hover:bg-ink/10",
    token: "bg-ink/10 text-ink/70 border-ink/30",
  },
};

/** Builds one chip <span> DOM node to insert into the contentEditable zone. */
function createChipNode(field) {
  const span = document.createElement("span");
  span.dataset.chipField = field.id;
  span.contentEditable = "false";
  span.setAttribute("aria-label", field.display);
  span.className = `inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded-full border text-[11px] font-mono align-baseline select-none ${
    COLOR_CLASSES[field.color].token
  }`;
  span.textContent = field.display;
  return span;
}

/** Returns a Range at the end of the given container's content. */
function rangeAtEnd(container) {
  const range = document.createRange();
  range.selectNodeContents(container);
  range.collapse(false);
  return range;
}

export default function FormatBuilder({ onPatternChange }) {
  const zoneRef = useRef(null);
  const lastRangeRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  /** Walks the contentEditable DOM and turns it into the token list formatBuilder.js expects. */
  const syncFromDOM = useCallback(() => {
    const container = zoneRef.current;
    if (!container) return;

    const tokens = [];
    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.nodeValue) tokens.push({ type: "text", value: node.nodeValue });
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      if (node.dataset && node.dataset.chipField) {
        tokens.push({ type: "chip", field: node.dataset.chipField });
        return;
      }
      // Browsers wrap wrapped lines in <div>/<br> on Enter inside a
      // contentEditable — treat block-level children as "previous line
      // ended" by emitting a newline text token before descending.
      const isBlock = node.tagName === "DIV" || node.tagName === "P";
      if (isBlock && tokens.length > 0) tokens.push({ type: "text", value: "\n" });
      if (node.tagName === "BR") {
        tokens.push({ type: "text", value: "\n" });
        return;
      }
      for (const child of node.childNodes) walk(child);
    };
    for (const child of container.childNodes) walk(child);

    setIsEmpty(container.textContent.trim().length === 0 && container.querySelector("[data-chip-field]") === null);

    const { pattern, flags, description, groupsUsed } = tokensToPattern(tokens);
    onPatternChange(pattern, flags, description, isPatternUsable(groupsUsed));
  }, [onPatternChange]);

  /** Records the current caret position, as long as it's inside the builder zone, so chip clicks (which blur the zone) still know where to insert. */
  const captureSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (zoneRef.current && zoneRef.current.contains(range.startContainer)) {
      lastRangeRef.current = range.cloneRange();
    }
  }, []);

  const insertChip = useCallback(
    (field, dropRange) => {
      const container = zoneRef.current;
      if (!container) return;
      container.focus();

      const range = dropRange || lastRangeRef.current || rangeAtEnd(container);
      // Guard against a stale range from a previous render/removed node.
      const targetRange = container.contains(range.startContainer) ? range : rangeAtEnd(container);

      const chipNode = createChipNode(field);
      targetRange.deleteContents();
      targetRange.insertNode(chipNode);

      // Move the caret to just after the newly-inserted chip so typing
      // continues naturally right after it.
      const after = document.createRange();
      after.setStartAfter(chipNode);
      after.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(after);
      lastRangeRef.current = after.cloneRange();

      syncFromDOM();
    },
    [syncFromDOM]
  );

  const handleChipClick = (field) => {
    insertChip(field, null);
  };

  const handleChipDragStart = (event, field) => {
    event.dataTransfer.setData("text/plain", field.id);
    event.dataTransfer.effectAllowed = "copy";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const fieldId = event.dataTransfer.getData("text/plain");
    const field = FIELD_BY_ID[fieldId];
    if (!field) return;

    let dropRange = null;
    if (document.caretRangeFromPoint) {
      dropRange = document.caretRangeFromPoint(event.clientX, event.clientY);
    } else if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(event.clientX, event.clientY);
      if (pos) {
        dropRange = document.createRange();
        dropRange.setStart(pos.offsetNode, pos.offset);
        dropRange.collapse(true);
      }
    }
    insertChip(field, dropRange);
  };

  // Handle Backspace/Delete landing right next to a chip: browsers treat
  // a contentEditable=false span as an atomic unit for arrow-key
  // traversal, but deletion behavior is inconsistent across browsers,
  // so we handle it explicitly for a reliable "one press removes the
  // whole chip" experience.
  const handleKeyDown = (event) => {
    if (event.key !== "Backspace" && event.key !== "Delete") return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const { startContainer, startOffset } = range;

    let chipToRemove = null;
    if (event.key === "Backspace") {
      if (startContainer.nodeType === Node.TEXT_NODE && startOffset === 0) {
        const prev = startContainer.previousSibling;
        if (prev && prev.dataset && prev.dataset.chipField) chipToRemove = prev;
      } else if (startContainer.nodeType === Node.ELEMENT_NODE) {
        const prev = startContainer.childNodes[startOffset - 1];
        if (prev && prev.dataset && prev.dataset.chipField) chipToRemove = prev;
      }
    } else {
      if (startContainer.nodeType === Node.TEXT_NODE && startOffset === startContainer.length) {
        const next = startContainer.nextSibling;
        if (next && next.dataset && next.dataset.chipField) chipToRemove = next;
      } else if (startContainer.nodeType === Node.ELEMENT_NODE) {
        const next = startContainer.childNodes[startOffset];
        if (next && next.dataset && next.dataset.chipField) chipToRemove = next;
      }
    }

    if (chipToRemove) {
      event.preventDefault();
      chipToRemove.remove();
      syncFromDOM();
    }
  };

  const handleClear = () => {
    if (zoneRef.current) zoneRef.current.innerHTML = "";
    lastRangeRef.current = null;
    syncFromDOM();
  };

  // Keep isEmpty accurate on mount (for the placeholder).
  useEffect(() => {
    syncFromDOM();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-body text-ink/60 mb-2">
          Drag a chip into the box below, or just click one to drop it at your cursor — then type any
          separators by hand (colons, dashes, new lines, punctuation…).
        </p>
        <div className="flex flex-wrap gap-1.5">
          {FORMAT_FIELDS.map((field) => (
            <button
              key={field.id}
              type="button"
              draggable
              onDragStart={(e) => handleChipDragStart(e, field)}
              onClick={() => handleChipClick(field)}
              title={field.description}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-mono cursor-grab active:cursor-grabbing transition-colors ${
                COLOR_CLASSES[field.color].chip
              }`}
            >
              {field.display}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-ink/40 uppercase tracking-wide">Your format</span>
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-[11px] text-ink/40 hover:text-accent transition-colors"
          >
            <RotateCcw size={11} />
            Clear
          </button>
        </div>
        <div className="relative">
          {isEmpty && (
            <div className="pointer-events-none absolute inset-0 px-3 py-2 font-mono text-xs text-ink/30">
              Drop or click chips here, e.g. [word] : [meaning]
            </div>
          )}
          <div
            ref={zoneRef}
            contentEditable
            suppressContentEditableWarning
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onInput={syncFromDOM}
            onKeyDown={handleKeyDown}
            onKeyUp={captureSelection}
            onMouseUp={captureSelection}
            onFocus={captureSelection}
            role="textbox"
            aria-multiline="true"
            aria-label="Custom format builder — drop or type to build your pattern"
            className={`w-full min-h-[4.5rem] bg-paper border rounded-sm px-3 py-2 font-mono text-xs text-ink leading-relaxed focus:outline-none transition-colors ${
              isDragOver ? "border-accent bg-accent/5" : "border-rule focus:border-accent"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
