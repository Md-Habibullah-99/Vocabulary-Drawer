/**
 * useCategoryMergeDrag.js
 * ------------------------
 * Extracted from Sidebar.jsx so the exact same "drag category A onto
 * category B -> confirm -> merge" interaction can be reused on the new
 * management page, instead of re-implementing (and risking drift
 * between) two copies of this logic.
 *
 * Dragging category A onto category B asks "merge A into B?" via a
 * confirmation modal rather than merging immediately on drop — a drop
 * is easy to trigger by accident, and this action deletes a category.
 *
 * Consumers render their own draggable/drop-target markup and wire up
 * the returned handlers, then render <MergeConfirmModal> (a portal, so
 * it's immune to any scrollable/transformed ancestor the list happens
 * to sit inside — see MergeConfirmModal.jsx for why that matters)
 * using `pendingDropMerge`, `confirmDropMerge`, and `cancelDropMerge`.
 *
 * @param {(fromCategory: string, toCategory: string) => void} onMergeCategory
 */
import { useState, useCallback } from "react";

export function useCategoryMergeDrag(onMergeCategory) {
  const [draggingCategory, setDraggingCategory] = useState(null);
  const [dragOverCategory, setDragOverCategory] = useState(null);
  const [pendingDropMerge, setPendingDropMerge] = useState(null); // { from, to }

  const handleDragStart = useCallback((e, category) => {
    setDraggingCategory(category);
    e.dataTransfer.effectAllowed = "move";
    // Some browsers require data to be set for drag to register at all.
    e.dataTransfer.setData("text/plain", category);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingCategory(null);
    setDragOverCategory(null);
  }, []);

  const handleDragOver = useCallback(
    (e, category) => {
      if (!draggingCategory || draggingCategory === category) return;
      e.preventDefault(); // required to allow a drop
      e.dataTransfer.dropEffect = "move";
      setDragOverCategory((prev) => (prev === category ? prev : category));
    },
    [draggingCategory]
  );

  const handleDragLeave = useCallback((category) => {
    setDragOverCategory((prev) => (prev === category ? null : prev));
  }, []);

  const handleDrop = useCallback(
    (e, targetCategory) => {
      e.preventDefault();
      setDraggingCategory((source) => {
        setDragOverCategory(null);
        if (source && source !== targetCategory) {
          setPendingDropMerge({ from: source, to: targetCategory });
        }
        return null;
      });
    },
    []
  );

  const confirmDropMerge = useCallback(() => {
    if (pendingDropMerge) {
      onMergeCategory(pendingDropMerge.from, pendingDropMerge.to);
    }
    setPendingDropMerge(null);
  }, [pendingDropMerge, onMergeCategory]);

  const cancelDropMerge = useCallback(() => setPendingDropMerge(null), []);

  return {
    draggingCategory,
    dragOverCategory,
    pendingDropMerge,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    confirmDropMerge,
    cancelDropMerge,
  };
}
