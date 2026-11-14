// reveal.tsx: the `Reveal` component. Wraps a whole component, shows the skeleton on its
// `data-veilo-slot` parts while data loads, and plays the reveal when it arrives.

import type { RevealOptions } from "@veilo/core";
import { createElement, useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import type { RevealConfig } from "./config.ts";
import { useReveal } from "./use-reveal.ts";

/** The elements `Reveal` can render as its container. */
export type RevealElement = "div" | "section" | "article" | "aside" | "figure" | "li" | "span";

/** Props of {@link Reveal}: the effect, the `ready` flag, and attributes for the container. */
export interface RevealProps extends RevealConfig, Omit<HTMLAttributes<HTMLElement>, "children"> {
  /**
   * Whether the content is ready. `false` shows the skeleton; turning `true` plays the reveal;
   * turning `false` again shows the skeleton again.
   */
  ready: boolean;
  /**
   * Play the reveal when `ready` is already `true` at mount (or after the effect changes).
   * Off by default: content that was there from the start, such as cached data, just shows.
   */
  revealOnMount?: boolean;
  /** The container element. Defaults to `div`. */
  as?: RevealElement;
  /** Core reveal options (`ink`, `fontFamily`, `reducedMotion`, ...). Read when it is created. */
  options?: RevealOptions;
  /** Called each time a reveal finishes. */
  onComplete?: () => void;
  /** The component to reveal, with `data-veilo-slot` on its parts. */
  children?: ReactNode;
}

/**
 * Wraps content in a container and runs a Veilo reveal on the `data-veilo-slot` elements inside.
 * While `ready` is `false` they show the skeleton (render placeholder data meanwhile, so the
 * parts have their real size); when it turns `true` the reveal plays once. The container gets
 * `aria-busy` while loading. Users who prefer reduced motion see the content at once.
 *
 * Side effects: through core, adds canvases, overlays and a stylesheet while mounted and removes
 * them on unmount.
 *
 * @param props - The effect (`preset`, `settings`, `layout`), `ready`, `revealOnMount`, `as`,
 *   `options`, `onComplete`, the children and any attributes for the container.
 * @returns The container with the children.
 */
export function Reveal(props: RevealProps) {
  const {
    ready,
    revealOnMount = false,
    as = "div",
    options,
    onComplete,
    preset,
    settings,
    layout,
    children,
    ...attributes
  } = props;
  const { ref, reveal } = useReveal({ preset, settings, layout }, options);

  // The reveal the effect below last saw, and whether content was ready then.
  const seen = useRef<{ reveal: typeof reveal; ready: boolean }>({ reveal: null, ready });
  useEffect(() => {
    if (!reveal) return;
    const first = seen.current.reveal !== reveal;
    const wasReady = seen.current.ready;
    seen.current = { reveal, ready };
    if (!ready) reveal.showLoading();
    // A new reveal (mount or effect change) plays only when asked; an existing one plays when
    // the content has just become ready. Strict Mode re-runs this effect with the same reveal
    // and the same flag, which does nothing.
    else if (first ? revealOnMount : !wasReady) void reveal.play();
  }, [reveal, ready, revealOnMount]);

  // The latest callback, so a new function on every render does not resubscribe.
  const complete = useRef(onComplete);
  complete.current = onComplete;
  useEffect(() => reveal?.on("complete", () => complete.current?.()), [reveal]);

  return createElement(as, { ...attributes, ref }, children);
}
