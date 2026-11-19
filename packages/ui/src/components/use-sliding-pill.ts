// use-sliding-pill.ts: the sliding selected-fill ("pill") of a tab bar or a segmented control, placed
// under the chosen item by script (the "Tabs sliding" pattern of transitions.dev).

import { useEffect, useLayoutEffect, type RefObject } from "react";

/**
 * Moves a pill element under the chosen item of a group, and keeps it there when the group is
 * resized, its items change size (a font loading, wrapping at a narrow width), or the choice
 * changes (the `data-state` attribute of any item).
 *
 * The first placement has no transition: `data-ready` is set on the pill only after it has been
 * painted, so the pill does not glide in from the corner. The pill is `data-placed` once it has a
 * position, which is when it becomes visible. Side effects: writes the pill's inline `transform`,
 * `width` and `height`, and observes the group and its items while enabled.
 *
 * @param group - The group element, the pill's positioned parent.
 * @param pill - The pill element inside it.
 * @param enabled - Whether to place the pill; nothing happens otherwise.
 * @param chosen - A selector for the chosen item inside the group, such as `[data-state="on"]`.
 */
export function useSlidingPill(
  group: RefObject<HTMLElement | null>,
  pill: RefObject<HTMLElement | null>,
  enabled: boolean,
  chosen: string,
): void {
  // Place before paint, so the pill is never seen in the wrong spot.
  useLayoutEffect(() => {
    const root = group.current;
    const element = pill.current;
    if (!enabled || !root || !element) return;
    const place = () => {
      const item = root.querySelector<HTMLElement>(chosen);
      if (!item) return;
      element.style.transform = `translate(${item.offsetLeft}px, ${item.offsetTop}px)`;
      element.style.width = `${item.offsetWidth}px`;
      element.style.height = `${item.offsetHeight}px`;
      element.dataset.placed = "true";
    };
    place();
    const resize = new ResizeObserver(place);
    resize.observe(root);
    for (const item of root.querySelectorAll("button")) resize.observe(item);
    // A choice changes an item's `data-state`; place again before the next paint.
    const change = new MutationObserver(place);
    change.observe(root, { subtree: true, attributes: true, attributeFilter: ["data-state"] });
    return () => {
      resize.disconnect();
      change.disconnect();
    };
  }, [group, pill, enabled, chosen]);

  // Switch the transition on once the first placement has been painted.
  useEffect(() => {
    const element = pill.current;
    if (!enabled || !element) return;
    const frame = requestAnimationFrame(() => {
      element.dataset.ready = "true";
    });
    return () => cancelAnimationFrame(frame);
  }, [pill, enabled]);
}
