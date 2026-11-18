// use-live-reveal.ts: plays a demo card's reveal once, as the site's own demos do.

import type { Reveal, Settings } from "@veilo/core";
import { useReveal, type LayoutInput } from "@veilo/react";
import { watchTheme } from "@veilo/ui";
import { useEffect, type RefCallback } from "react";

/**
 * Plays an effect on a container once (skeleton, reveal, finished card) and then rests on the
 * finished card; the caller replays it on request through the reported reveal. The reveal reads
 * its ink from the page, so it is redrawn when the theme changes.
 *
 * Side effects: creates a reveal through `useReveal` and destroys it on unmount; plays the sequence
 * once and listens for theme changes while mounted; reports the reveal to `onReveal`.
 *
 * @param settings - The effect to play: the skeleton loader and the reveal, as settings.
 * @param layout - The slot hints for the card's parts.
 * @param onReveal - Called with the live reveal, and with `null` when there is none.
 * @returns A ref for the container that holds the `data-veilo-slot` elements.
 */
export function useLiveReveal(
  settings: Partial<Settings>,
  layout: LayoutInput,
  onReveal: (reveal: Reveal | null) => void,
): RefCallback<HTMLElement> {
  const { ref, reveal } = useReveal<HTMLElement>({ settings, layout });

  useEffect(() => {
    onReveal(reveal);
    if (!reveal) return;
    reveal.playSequence();
    const stop = watchTheme(() => reveal.redraw());
    return () => {
      stop();
      onReveal(null);
    };
  }, [reveal, onReveal]);

  return ref;
}
