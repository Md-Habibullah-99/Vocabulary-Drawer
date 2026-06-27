/**
 * Sidebar.jsx
 * ------------
 * The "card-catalog drawer" navigation. Top level = categories (with
 * "All Words" pinned first), each expandable to show the five status
 * sub-views (All / Difficult / Easy / Favorite / Done) with live counts.
 *
 * Props:
 *  - categories: string[] — from getCategoryList()
 *  - activeCategory, activeStatus: the current selection
 *  - onSelect: (category, status) => void
 *  - getCounts: (category) => { all, difficult, easy, favorite, done }
 */

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Library } from "lucide-react";
import { STATUS_FILTERS, statusLabel, ALL_WORDS_CATEGORY } from "../utils/categoryTree";

export default function Sidebar({
  categories,
  activeCategory,
  activeStatus,
  onSelect,
  getCounts,
}) {
  // Tracks which category drawers are expanded. "All Words" starts open
  // since it's almost always the first thing a learner browses.
  const [expanded, setExpanded] = useState({ [ALL_WORDS_CATEGORY]: true });

  const toggleExpanded = (category) => {
    setExpanded((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <nav
      aria-label="Flashcard categories"
      className="w-full md:w-64 flex-shrink-0 border-r border-rule bg-paper md:h-full overflow-y-auto"
    >
      <div className="px-4 py-4 flex items-center gap-2 border-b border-rule">
        <Library size={18} className="text-accent" strokeWidth={2.2} />
        <span className="font-display font-semibold text-ink text-lg">Word Drawer</span>
      </div>

      <ul className="py-2">
        {categories.map((category) => {
          const isOpen = !!expanded[category];
          const isCategoryActive = activeCategory === category;
          const counts = getCounts(category);

          return (
            <li key={category} className="px-2">
              <button
                type="button"
                onClick={() => toggleExpanded(category)}
                className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded-sm text-left font-body text-sm transition-colors ${
                  isCategoryActive ? "text-accent" : "text-ink/85"
                } hover:bg-ink/[0.04]`}
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  {isOpen ? (
                    <ChevronDown size={14} className="flex-shrink-0 opacity-60" />
                  ) : (
                    <ChevronRight size={14} className="flex-shrink-0 opacity-60" />
                  )}
                  <span
                    className={`truncate ${
                      category === ALL_WORDS_CATEGORY ? "font-semibold" : ""
                    }`}
                  >
                    {category}
                  </span>
                </span>
                <span className="font-mono text-xs text-ink/40 flex-shrink-0">
                  {counts.all}
                </span>
              </button>

              {isOpen && (
                <ul className="ml-5 mb-1 border-l border-rule pl-2">
                  {STATUS_FILTERS.map((status) => {
                    const isActive =
                      isCategoryActive && activeStatus === status;
                    return (
                      <li key={status}>
                        <button
                          type="button"
                          onClick={() => onSelect(category, status)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-sm font-body text-[13px] transition-colors ${
                            isActive
                              ? "bg-accent/10 text-accent font-medium"
                              : "text-ink/65 hover:bg-ink/[0.04]"
                          }`}
                        >
                          <span>{statusLabel(status)}</span>
                          <span className="font-mono text-[11px] text-ink/35">
                            {counts[status]}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
