/**
 * visibility.ts: reports when an element can be seen, so animations pause off-screen.
 * Layer 1 (browser). Touches browser globals only when called, never at import time.
 */

/**
 * Watches whether an element is on screen and its tab is showing.
 *
 * The element counts as visible while it intersects the viewport and the page is not hidden.
 * It starts as visible, so `onChange` first fires when it is found to be hidden.
 *
 * @param element - The element to watch.
 * @param onChange - Called with the new state each time it changes.
 * @returns A function that stops watching. Calling it again does nothing.
 */
export function watchVisibility(
  element: Element,
  onChange: (visible: boolean) => void,
): () => void {
  let intersecting = true;
  let visible = true;

  const update = () => {
    const next = intersecting && document.visibilityState !== "hidden";
    if (next === visible) return;
    visible = next;
    onChange(next);
  };

  const observer = new IntersectionObserver((entries) => {
    // Several entries can arrive at once; the last one is the current state.
    const last = entries.at(-1);
    if (last) intersecting = last.isIntersecting;
    update();
  });
  observer.observe(element);
  document.addEventListener("visibilitychange", update);

  return () => {
    observer.disconnect();
    document.removeEventListener("visibilitychange", update);
  };
}
