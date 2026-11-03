/**
 * overlay.ts: covers a text element with an aria-hidden overlay for scramble and typewriter.
 * Layer 1 (browser). Touches browser globals only when called, never at import time.
 */

/** The overlay added to a text element, and how to remove it. */
export interface TextOverlay {
  /** The `aria-hidden` element on top of the real text. */
  overlay: HTMLSpanElement;
  /** Removes the overlay and restores the element's inline styles. */
  unmount(): void;
}

const FILL = "-webkit-text-fill-color";

/**
 * Covers a text element with an overlay.
 *
 * The real text stays in place, so the layout does not move and screen readers still read it,
 * but its glyphs are not painted (`-webkit-text-fill-color: transparent`, which children
 * inherit too). The element's `color` is untouched, so the overlay, which paints with
 * `currentcolor`, always follows the live text color. Decorations such as a strike-through are
 * not shown on the overlay text. The overlay is `aria-hidden`, absolutely positioned over the element and ignores
 * the pointer. If the element is `position: static` it becomes `relative`, which does not move
 * it. On an inline element the overlay does not wrap, because it is only as wide as the text.
 *
 * @param element - The text element. Must be attached to the page, so its styles can be read.
 * @returns The overlay and its `unmount`.
 */
export function mountTextOverlay(element: HTMLElement): TextOverlay {
  const computed = getComputedStyle(element);
  const { style } = element;
  const position = style.position;
  const fill = style.getPropertyValue(FILL);
  const fillPriority = style.getPropertyPriority(FILL);
  const hadStyle = element.hasAttribute("style");

  const overlay = document.createElement("span");
  overlay.setAttribute("aria-hidden", "true");
  Object.assign(overlay.style, { position: "absolute", inset: "0", pointerEvents: "none" });
  overlay.style.setProperty(FILL, "currentcolor");
  if (computed.display === "inline") overlay.style.whiteSpace = "nowrap";

  if (computed.position === "static") style.position = "relative";
  style.setProperty(FILL, "transparent");
  element.append(overlay);

  return {
    overlay,
    unmount() {
      overlay.remove();
      style.position = position;
      if (fill) style.setProperty(FILL, fill, fillPriority);
      else style.removeProperty(FILL);
      if (!hadStyle && element.getAttribute("style") === "") element.removeAttribute("style");
    },
  };
}
