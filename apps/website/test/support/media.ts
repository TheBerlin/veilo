// media.ts: lets a test pretend the visitor asks for less motion. A shared helper, an agreed
// exception to the one-to-one test mirror, like the setup file beside it.

import { vi } from "vitest";

/**
 * Makes `matchMedia` report that the visitor prefers reduced motion, for the rest of the test. The
 * other media queries are answered by the real browser. Restore with `vi.restoreAllMocks()`.
 *
 * Side effects: replaces `window.matchMedia` with a spy until it is restored.
 *
 * @returns Nothing.
 */
export function reduceMotion(): void {
  const real = window.matchMedia.bind(window);
  // A media query list's methods need the real object as `this`.
  const bound = (media: MediaQueryList, key: string | symbol) => {
    const value = Reflect.get(media, key);
    return typeof value === "function" ? value.bind(media) : value;
  };
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
    const media = real(query);
    return query.includes("prefers-reduced-motion")
      ? new Proxy(media, { get: (target, key) => (key === "matches" ? true : bound(target, key)) })
      : media;
  });
}
