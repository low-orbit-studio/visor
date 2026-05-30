import { useEffect, useRef } from "react";

/** The metrics needed to map one pane's scroll position onto another. */
export interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

/**
 * Map a source pane's vertical scroll position onto a destination pane,
 * proportionally to each pane's scrollable range.
 *
 * When both panes hold the same content (the common case — same module on each
 * side) the source and destination ranges are equal, so this reduces to a 1:1
 * mapping. When the panes show different modules (the edge case sync-scroll's
 * toggle exists for) the proportional mapping keeps their relative positions
 * aligned instead of drifting apart. Returns 0 when either pane cannot scroll.
 */
export function computeSyncTarget(
  src: ScrollMetrics,
  dst: Pick<ScrollMetrics, "scrollHeight" | "clientHeight">,
): number {
  const srcMax = src.scrollHeight - src.clientHeight;
  const dstMax = dst.scrollHeight - dst.clientHeight;
  if (srcMax <= 0 || dstMax <= 0) return 0;
  const ratio = src.scrollTop / srcMax;
  return ratio * dstMax;
}

/**
 * Wire two scroll containers so scrolling either one mirrors the other,
 * proportionally. Syncing is active only while `enabled` is true; flipping it
 * off lets the panes scroll independently (the listeners are torn down).
 *
 * A lock released on the next animation frame swallows the scroll event that the
 * mirrored write itself triggers, so the two panes don't ping-pong updates.
 */
export function useSyncedScroll(enabled: boolean) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;

    let locked = false;
    const mirror = (src: HTMLDivElement, dst: HTMLDivElement) => () => {
      if (locked) return;
      locked = true;
      dst.scrollTop = computeSyncTarget(src, dst);
      dst.scrollLeft = src.scrollLeft;
      requestAnimationFrame(() => {
        locked = false;
      });
    };

    const onLeftScroll = mirror(left, right);
    const onRightScroll = mirror(right, left);
    left.addEventListener("scroll", onLeftScroll, { passive: true });
    right.addEventListener("scroll", onRightScroll, { passive: true });
    return () => {
      left.removeEventListener("scroll", onLeftScroll);
      right.removeEventListener("scroll", onRightScroll);
    };
  }, [enabled]);

  return { leftRef, rightRef };
}
