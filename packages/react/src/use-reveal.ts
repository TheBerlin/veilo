// use-reveal.ts: the hook every component builds on. Runs core's reveal on one element for as
// long as it is mounted, safely under React Strict Mode.

import { createReveal, type Reveal, type RevealOptions, type RevealState } from "@veilo/core";
import { useEffect, useRef, useState, type RefCallback } from "react";
import { configKey, resolveConfig, type RevealConfig } from "./config.ts";

/** What {@link useReveal} returns. */
export interface UseRevealResult<T extends HTMLElement> {
  /** Put on the container that holds the `data-veilo-slot` elements. */
  ref: RefCallback<T>;
  /** The live reveal for imperative control, or `null` before mount and after unmount. */
  reveal: Reveal | null;
  /** The reveal's state, updated as React state (progress is not, as it changes every frame). */
  state: RevealState;
}

/**
 * Runs a Veilo reveal on a container. The reveal is created when the element mounts, rebuilt
 * when the effect config changes (compared by value), and destroyed on unmount, which restores
 * the element exactly. The hook starts nothing: call `reveal.showLoading()`, `play()` or
 * `playSequence()`, or use the `Reveal` component, which does it from a `ready` flag.
 *
 * Side effects: creates canvases, overlays and a stylesheet through core while mounted. Under
 * Strict Mode, React mounts twice in development; the first reveal is destroyed before the
 * second is made, so nothing is left behind.
 *
 * @param config - The preset, settings and layout to animate.
 * @param options - Core reveal options. Read when the reveal is created, so a change applies at
 *   the next rebuild, not at once.
 * @returns A ref for the container, the reveal and its state.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(
  config: RevealConfig = {},
  options?: RevealOptions,
): UseRevealResult<T> {
  // The element as state, so attaching it (or a different one) runs the effect below.
  const [element, setElement] = useState<T | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [state, setState] = useState<RevealState>("idle");
  // Latest values, read inside the effect without making them dependencies.
  const latest = useRef({ config, options });
  latest.current = { config, options };
  const key = configKey(config);

  useEffect(() => {
    if (!element) return;
    const instance = createReveal(
      element,
      resolveConfig(latest.current.config),
      latest.current.options,
    );
    const unsubscribe = instance.on("state", setState);
    setReveal(instance);
    setState(instance.state);
    return () => {
      unsubscribe();
      instance.destroy();
      setReveal((current) => (current === instance ? null : current));
      setState("idle");
    };
  }, [element, key]);

  return { ref: setElement, reveal, state };
}
