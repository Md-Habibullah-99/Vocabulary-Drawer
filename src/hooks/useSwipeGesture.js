/**
 * useSwipeGesture.js
 * -------------------
 * Native touch-gesture detection for the deck viewer (see HomeView.jsx)
 * — no gesture library needed, just the raw Touch Events API.
 *
 * WHY A REF + addEventListener INSTEAD OF onTouchMove={...} PROPS:
 * React attaches its synthetic `touchstart`/`touchmove` listeners as
 * PASSIVE by default (this is a deliberate React/browser optimization
 * for scroll performance). A passive listener's `event.preventDefault()`
 * call is silently ignored by the browser. Since this hook needs to
 * block vertical scrolling ONLY once it's confident the user is mid
 * horizontal-swipe, it attaches its own `touchmove` listener manually
 * with `{ passive: false }`, via a ref + effect, instead of relying on
 * JSX touch props.
 *
 * GESTURE LOGIC
 * -------------
 *  - touchstart records the origin point and resets "intent" (we don't
 *    yet know if this gesture is a horizontal swipe or a vertical
 *    scroll).
 *  - touchmove watches the accumulated delta. Once the finger has
 *    moved more than a small `INTENT_THRESHOLD_PX`, we decide once
 *    (and only once) whether this gesture reads as horizontal or
 *    vertical, by comparing |dx| to |dy|. Only after we've committed
 *    to "horizontal" do we call preventDefault() — so normal vertical
 *    page/list scrolling is never interrupted.
 *  - touchend checks the final horizontal distance against
 *    SWIPE_THRESHOLD_PX (50px — big enough that a scroll-jitter or a
 *    stray tap never fires it by accident) AND checks that vertical
 *    drift stayed under MAX_VERTICAL_DRIFT_PX, so a diagonal drag
 *    doesn't misfire as a swipe. Swiping right-to-left (negative dx)
 *    calls onSwipeLeft (-> "next word"); left-to-right calls
 *    onSwipeRight (-> "previous word").
 *
 * Usage:
 *   const swipeRef = useSwipeGesture({ onSwipeLeft: goNext, onSwipeRight: goPrevious });
 *   <main ref={swipeRef}>...</main>
 */
import { useRef, useEffect } from "react";

const SWIPE_THRESHOLD_PX = 50; // minimum horizontal travel to count as an intentional swipe
const INTENT_THRESHOLD_PX = 10; // how far the finger must move before we classify the gesture
const MAX_VERTICAL_DRIFT_PX = 75; // how much vertical drift a "horizontal" swipe tolerates

export function useSwipeGesture({ onSwipeLeft, onSwipeRight, enabled = true }) {
  const nodeRef = useRef(null);
  // Refs (not state) for touch bookkeeping — this data changes many
  // times per gesture and should never trigger a re-render.
  const originRef = useRef(null); // { x, y } at touchstart
  const intentRef = useRef(null); // null | "horizontal" | "vertical"

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !enabled) return undefined;

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      originRef.current = { x: touch.clientX, y: touch.clientY };
      intentRef.current = null;
    };

    const handleTouchMove = (e) => {
      if (!originRef.current) return;
      const touch = e.touches[0];
      const dx = touch.clientX - originRef.current.x;
      const dy = touch.clientY - originRef.current.y;

      if (
        intentRef.current === null &&
        (Math.abs(dx) > INTENT_THRESHOLD_PX || Math.abs(dy) > INTENT_THRESHOLD_PX)
      ) {
        intentRef.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      }

      // Only swallow the scroll once a horizontal swipe is clearly
      // underway — a vertical scroll (or an as-yet-undecided gesture)
      // is left completely alone.
      if (intentRef.current === "horizontal" && e.cancelable) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e) => {
      if (!originRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - originRef.current.x;
      const dy = touch.clientY - originRef.current.y;

      if (
        intentRef.current === "horizontal" &&
        Math.abs(dx) >= SWIPE_THRESHOLD_PX &&
        Math.abs(dy) <= MAX_VERTICAL_DRIFT_PX
      ) {
        if (dx < 0) onSwipeLeft?.();
        else onSwipeRight?.();
      }

      originRef.current = null;
      intentRef.current = null;
    };

    const handleTouchCancel = () => {
      originRef.current = null;
      intentRef.current = null;
    };

    // touchstart/touchend stay passive (they never call preventDefault);
    // only touchmove needs { passive: false } to be allowed to block scroll.
    node.addEventListener("touchstart", handleTouchStart, { passive: true });
    node.addEventListener("touchmove", handleTouchMove, { passive: false });
    node.addEventListener("touchend", handleTouchEnd, { passive: true });
    node.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      node.removeEventListener("touchstart", handleTouchStart);
      node.removeEventListener("touchmove", handleTouchMove);
      node.removeEventListener("touchend", handleTouchEnd);
      node.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [enabled, onSwipeLeft, onSwipeRight]);

  return nodeRef;
}
