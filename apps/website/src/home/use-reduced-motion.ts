// use-reduced-motion.ts: follows the visitor's request for less motion.

import { useSyncExternalStore } from "react";

/** The media query of the visitor's request for less motion. */
const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Tells whether the visitor asks for less motion, and follows a change of the setting.
 *
 * Side effects: listens to the media query while mounted. On the server, or where `matchMedia` does
 * not exist, the answer is no.
 *
 * @returns True while the visitor asks for less motion.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof matchMedia === "undefined") return () => {};
      const media = matchMedia(QUERY);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    () => typeof matchMedia !== "undefined" && matchMedia(QUERY).matches,
    () => false,
  );
}
