// use-seen.ts: tells once that an element has been scrolled into view, for entrances that play once.

import { useEffect, useState } from "react";

/**
 * Reports, once, that an element has come into view (or has been scrolled past, in a fast jump).
 * It never turns false again, so an entrance plays once and the content stays put. Without
 * `IntersectionObserver` the element counts as seen at once, so nothing stays hidden.
 *
 * Side effects: observes the element until it is seen, then stops.
 *
 * @returns A callback ref for the element (pass it as `ref`), and whether it has been seen.
 */
export function useSeen<T extends Element>(): { ref: (element: T | null) => void; seen: boolean } {
  const [element, setElement] = useState<T | null>(null);
  const [seen, setSeen] = useState(typeof IntersectionObserver === "undefined");
  useEffect(() => {
    if (seen || !element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // An element above the viewport (scrolled past) counts as seen, so it never sits hidden.
        if (entries.some((entry) => entry.isIntersecting || entry.boundingClientRect.top < 0)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      // Wait until the block is a little way into the screen, so the entrance is noticed.
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, seen]);
  return { ref: setElement, seen };
}
