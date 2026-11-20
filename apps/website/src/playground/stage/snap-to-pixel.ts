// snap-to-pixel.ts: keeps the stage's centered card on whole device pixels.

/**
 * Nudges an element so its top edge lands on a whole pixel.
 *
 * Centering can leave a card half a pixel off (a stage 171 px taller than the card puts it at
 * 85.5): its edges and the grid canvas then blur, and a screenshot of its box grows by a pixel.
 * The nudge is `top` (up to half a pixel either way) on a positioned element, not a transform:
 * Chromium draws text inside a transformed box on different pixels than text laid out there.
 * Safe to call again after any size change.
 *
 * @param element - The element to snap, normally the card. It must be positioned (not static).
 * @returns Nothing. Side effect: sets or clears `element.style.top`.
 */
export function snapToWholePixel(element: HTMLElement): void {
  // Measure from the layout position, not from the last nudge.
  element.style.top = "";
  const top = element.getBoundingClientRect().top;
  const offset = Math.round(top) - top;
  // A float error under a thousandth of a pixel is not worth a style.
  if (Math.abs(offset) > 0.001) element.style.top = `${offset}px`;
}

/**
 * Snaps the first child of a container now and whenever the container resizes.
 *
 * @param container - The stage section; its first element child is the card.
 * @returns A function that stops watching. Side effect: observes the container's size and the
 * card's, and sets `top` on the card.
 */
export function watchWholePixel(container: HTMLElement): () => void {
  const snap = () => {
    const card = container.firstElementChild;
    if (card instanceof HTMLElement) snapToWholePixel(card);
  };
  snap();
  // The card's own size changes too (width, ratio, a late image), not only the stage's.
  const observer = new ResizeObserver(snap);
  observer.observe(container);
  const card = container.firstElementChild;
  if (card) observer.observe(card);
  return () => observer.disconnect();
}
