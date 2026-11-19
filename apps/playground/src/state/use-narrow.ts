// use-narrow.ts: tells whether the screen is narrow, where the playground is laid out for a phone.

import { useSyncExternalStore } from "react";

/** The spec's breakpoint: custom properties do not work in media queries, so it is written out. */
const NARROW_QUERY = "(max-width: 900px)";

/**
 * Follows the narrow-screen media query, so the app can build a different set of parts for a
 * phone (a bottom row and a settings sheet) instead of only restyling the desktop ones.
 *
 * Side effects: listens to the media query while mounted.
 *
 * @returns True at 900 px and below. False while rendering on a server.
 */
export function useNarrow(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const media = matchMedia(NARROW_QUERY);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    () => matchMedia(NARROW_QUERY).matches,
    () => false,
  );
}
