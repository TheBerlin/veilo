/**
 * overlay.ts: covers a text element with an aria-hidden overlay for scramble and typewriter.
 * Layer 1 (browser). Touches browser globals only when called, never at import time.
 */

/** The overlay added to a text element, and how to remove it. */
export interface TextOverlay {
  /** The `aria-hidden` element on top of the real text. */
  overlay: HTMLSpanElement;
  /** Removes the overlay and restores the element's inline `color` and `position`. */
  unmount(): void;
}

/**
 * Covers a text element with an overlay.
 *
 * The real text stays in place but turns transparent, so the layout does not move and screen
 * readers still read it. The overlay is `aria-hidden`, absolutely positioned over the element and
 * ignores the pointer. If the element is `position: static` it becomes `relative`, so the overlay
 * is placed on it; this does not move the element. Child elements with a color of their own stay
 * visible, so point this at plain text elements.
 *
 * @param element - The text element. Must be attached to the page, so its color can be read.
 * @returns The overlay and its `unmount`.
 */
export function mountTextOverlay(element: HTMLElement): TextOverlay {
  const computed = getComputedStyle(element);
  const { color, position } = element.style;

  const overlay = document.createElement("span");
  overlay.setAttribute("aria-hidden", "true");
  // Set before the element turns transparent, because the overlay would inherit that.
  Object.assign(overlay.style, {
    position: "absolute",
    inset: "0",
    pointerEvents: "none",
    color: computed.color,
  });

  if (computed.position === "static") element.style.position = "relative";
  element.style.color = "transparent";
  element.append(overlay);

  return {
    overlay,
    unmount() {
      overlay.remove();
      element.style.color = color;
      element.style.position = position;
    },
  };
}
