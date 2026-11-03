// overlay.ts: covers a text element with an aria-hidden overlay for scramble and typewriter.
// Layer 1 (browser). Touches browser globals only when called, never at import time.

import { createCleanup } from "./cleanup.ts";

/** The overlay added to a text element, and how to remove it. */
export interface TextOverlay {
  /** The `aria-hidden` element on top of the real text. */
  overlay: HTMLSpanElement;
  /** Removes the overlay and restores the element exactly. */
  unmount(): void;
}

/**
 * Covers a text element with an overlay.
 *
 * The real text stays in place, so the layout does not move and screen readers still read it,
 * but its glyphs are not painted (`-webkit-text-fill-color: transparent`, which children
 * inherit too). The element's `color` is untouched, so the overlay, which paints with
 * `currentcolor`, always follows the live text color. Decorations such as a strike-through are
 * not shown on the overlay text. The overlay is `aria-hidden`, absolutely positioned over the
 * element and ignores the pointer. If the element is `position: static` it becomes `relative`,
 * which does not move it. On an inline element the overlay does not wrap, because it is only as
 * wide as the text.
 *
 * @param element - The text element. Must be attached to the page, so its styles can be read.
 * @returns The overlay and its `unmount`.
 */
export function mountTextOverlay(element: HTMLElement): TextOverlay {
  const computed = getComputedStyle(element);
  const cleanup = createCleanup();

  const overlay = document.createElement("span");
  overlay.setAttribute("aria-hidden", "true");
  Object.assign(overlay.style, { position: "absolute", inset: "0", pointerEvents: "none" });
  overlay.style.setProperty("-webkit-text-fill-color", "currentcolor");
  if (computed.display === "inline") overlay.style.whiteSpace = "nowrap";

  if (computed.position === "static") cleanup.style(element, "position", "relative");
  cleanup.style(element, "-webkit-text-fill-color", "transparent");
  element.append(overlay);
  cleanup.add(() => overlay.remove());

  return { overlay, unmount: () => cleanup.run() };
}
