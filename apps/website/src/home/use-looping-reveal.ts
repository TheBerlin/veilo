// use-looping-reveal.ts: plays a demo's reveal over and over, except for visitors who ask for less
// motion, who get the finished content and nothing that repeats.

import type { RevealState, Settings } from "@veilo-ui/core";
import type { LayoutInput } from "@veilo-ui/presets";
import { useReveal } from "@veilo-ui/react";
import { useEffect, useState } from "react";

/** The media query of the visitor's request for less motion. */
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Plays a reveal on a container over and over once the demo is active. A visitor who asks for less
 * motion gets the reveal once instead, which core jumps straight to the finished content for.
 * Looping would be wrong for them: core stills the skeleton but still switches between it and the
 * content, a flash every couple of seconds, and content shown only part of the time.
 *
 * Side effects: creates a reveal and destroys it on unmount; reads the motion preference and
 * starts a looping sequence (or a single reveal) when `active` turns true.
 *
 * @param settings - The effect.
 * @param layout - The slot hints.
 * @param active - Whether the demo has been scrolled into view.
 * @param paused - Whether the visitor has paused it. The loop stops and the content shows, finished,
 * until it is played again.
 * @returns A ref for the container that holds the slots, and the reveal's state (`idle` until it
 * exists), for a demo that shows something beside it that follows the same cycle.
 */
export function useLoopingReveal(
  settings: Partial<Settings>,
  layout: LayoutInput,
  active: boolean,
  paused = false,
) {
  const { ref, reveal } = useReveal<HTMLDivElement>({ settings, layout });
  const [state, setState] = useState<RevealState>("idle");
  useEffect(() => {
    if (!reveal) return;
    setState(reveal.state);
    return reveal.on("state", setState);
  }, [reveal]);
  useEffect(() => {
    if (!active || !reveal) return;
    if (matchMedia(REDUCED_MOTION).matches) {
      void reveal.play();
    } else if (paused) {
      // Stops the loop and shows the real content, still.
      reveal.seek(1);
    } else {
      reveal.playSequence({ loop: true });
    }
  }, [active, reveal, paused]);
  return { ref, state };
}
