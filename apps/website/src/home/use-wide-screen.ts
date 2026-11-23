// use-wide-screen.ts: follows whether the window is wider than the layout's phone breakpoint.

import { GRID_BREAKPOINT } from "@veilo-ui/ui";
import { useSyncExternalStore } from "react";

/** The media query of the wide layout: the grid's breakpoint is the last narrow width. */
const QUERY = `(min-width: ${GRID_BREAKPOINT + 1}px)`;

/**
 * Tells whether the window is in the wide (desktop) layout, and follows a resize across the
 * breakpoint.
 *
 * Side effects: listens to the media query while mounted. Where `matchMedia` does not exist the
 * answer is yes.
 *
 * @returns True above 900 px.
 */
export function useWideScreen(): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof matchMedia === "undefined") return () => {};
      const media = matchMedia(QUERY);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    () => typeof matchMedia === "undefined" || matchMedia(QUERY).matches,
    () => true,
  );
}
