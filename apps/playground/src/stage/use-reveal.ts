// use-reveal.ts: runs core's reveal controller on an element for as long as a component is
// mounted.

import { createReveal, type Layout, type Reveal, type RevealOptions } from "@veilo/core";
import { useEffect, useRef, type RefObject } from "react";

/**
 * Creates a reveal on the element when the component mounts, starts the full sequence, and
 * destroys it on unmount, which restores the element exactly. React's development mode mounts
 * twice; the first reveal is destroyed before the second is made, so this is safe to repeat.
 * The layout and options are read once, at mount.
 *
 * @param element - Ref to the container with the slot markup.
 * @param layout - Settings and slot hints.
 * @param options - Reveal options, such as a test scheduler.
 * @returns A ref holding the live reveal, or `null` before mount and after unmount.
 */
export function useReveal(
  element: RefObject<HTMLElement | null>,
  layout: Layout,
  options?: RevealOptions,
): RefObject<Reveal | null> {
  const reveal = useRef<Reveal | null>(null);
  // Read once: later changes are applied by the transport and tabs, not by re-creating.
  const initial = useRef({ layout, options });

  useEffect(() => {
    const target = element.current;
    if (!target) return;
    const { layout: startLayout, options: startOptions } = initial.current;
    // The playground previews effects even when the viewer prefers reduced motion (spec).
    const instance = createReveal(target, startLayout, { reducedMotion: false, ...startOptions });
    reveal.current = instance;
    instance.playSequence();
    return () => {
      instance.destroy();
      if (reveal.current === instance) reveal.current = null;
    };
  }, [element]);

  return reveal;
}
