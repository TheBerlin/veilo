// use-live-reveal.ts: plays a demo card's reveal once, as the site's own demos do.

import type { Reveal, Settings } from "@veilo-ui/core";
import { useReveal, type LayoutInput } from "@veilo-ui/react";
import { watchTheme } from "@veilo-ui/ui";
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
 * @param play - Whether to play now (default). While false the card waits as a skeleton; when it
 *   turns true the sequence plays, which lets a caller chain several cards one after another.
 * @returns A ref for the container that holds the `data-veilo-slot` elements.
 */
export function useLiveReveal(
  settings: Partial<Settings>,
  layout: LayoutInput,
  onReveal: (reveal: Reveal | null) => void,
  play = true,
): RefCallback<HTMLElement> {
  const { ref, reveal } = useReveal<HTMLElement>({ settings, layout });

  useEffect(() => {
    onReveal(reveal);
    if (!reveal) return;
    if (play) reveal.playSequence();
    else reveal.showLoading();
    const stop = watchTheme(() => reveal.redraw());
    return () => {
      stop();
      onReveal(null);
    };
  }, [reveal, onReveal, play]);

  return ref;
}
