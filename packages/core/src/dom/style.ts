/**
 * style.ts: adds a stylesheet to the page and removes it again.
 * Layer 1 (browser). Touches browser globals only when called, never at import time.
 */

/**
 * Reads the computed value of a CSS property, including custom properties such as `--sk-ink`.
 *
 * @param element - The element to read.
 * @param property - The property name, in CSS form (`color`, `--sk-ink`).
 * @returns The trimmed value, or an empty string when it is not set.
 */
export function computedValue(element: Element, property: string): string {
  return getComputedStyle(element).getPropertyValue(property).trim();
}

/**
 * Adds a `<style>` element with the given CSS.
 *
 * The CSS is written with `textContent`, never parsed as HTML.
 *
 * @param css - The stylesheet text.
 * @param root - Where to add it: a shadow root, or the document head by default.
 * @returns A function that removes the stylesheet. Calling it again does nothing.
 */
export function addStyle(css: string, root?: ShadowRoot): () => void {
  const style = document.createElement("style");
  style.textContent = css;
  (root ?? document.head).append(style);
  return () => style.remove();
}
