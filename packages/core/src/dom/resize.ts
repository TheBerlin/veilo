/**
 * resize.ts: reports when an element changes size, so the grid can be sampled again.
 * Layer 1 (browser). Touches browser globals only when called, never at import time.
 */

/**
 * Watches an element's border box size.
 *
 * The spec redraws when the image resizes by 2 px or more, so smaller changes, such as
 * sub-pixel layout jitter, are ignored. The first size the observer reports is the starting
 * point and is not reported.
 *
 * @param element - The element to watch.
 * @param onResize - Called with the new width and height in CSS pixels.
 * @param threshold - The smallest change in either direction that counts, 2 px by default.
 * @returns A function that stops watching. Calling it again does nothing.
 */
export function watchResize(
  element: Element,
  onResize: (width: number, height: number) => void,
  threshold = 2,
): () => void {
  let last: { width: number; height: number } | undefined;

  const observer = new ResizeObserver(() => {
    const { width, height } = element.getBoundingClientRect();
    if (!last) {
      last = { width, height };
      return;
    }
    if (Math.abs(width - last.width) < threshold && Math.abs(height - last.height) < threshold) {
      return;
    }
    last = { width, height };
    onResize(width, height);
  });
  observer.observe(element);
  return () => observer.disconnect();
}
