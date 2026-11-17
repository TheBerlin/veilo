// skeleton.tsx: the `Skeleton` component. Shows the loader (shimmer, wave or pulse) on real
// elements while their content loads, with no reveal afterwards.

import {
  createSkeleton,
  type Settings,
  type Skeleton as CoreSkeleton,
  type SkeletonOptions,
} from "@veilo/core";
import { Slot } from "@radix-ui/react-slot";
import {
  createElement,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { configKey, resolveConfig, type RevealConfig } from "@veilo/presets";
import type { RevealElement } from "./reveal.tsx";
import { useServerSkeleton } from "./server-skeleton.tsx";

/** Props of {@link Skeleton}: the loader, the `loading` flag, and attributes for the element. */
export interface SkeletonProps extends RevealConfig, Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** Whether the content is loading. `true` shows the loader; `false` restores the elements. */
  loading: boolean;
  /** Shortcut for the loader effect; wins over `preset` and `settings`. */
  effect?: Settings["effect"];
  /**
   * Put the loader on the single child itself instead of on the slots inside a container. No
   * element is added; the child gets the ref and these props (Radix `Slot`). It must accept a
   * ref: a DOM element, or a component that forwards it.
   */
  asChild?: boolean;
  /** The container element when not `asChild`. Defaults to `div`. */
  as?: RevealElement;
  /** Core skeleton options (`busy`, `root`, `warnings`, fallback colors). Read when created. */
  options?: SkeletonOptions;
  /** The content: elements with `data-veilo-slot`, or the single child with `asChild`. */
  children?: ReactNode;
}

/**
 * Shows a Veilo loader while `loading` is `true`. By default it renders a container (`as`,
 * a `div` unless set) and every `data-veilo-slot` element inside becomes a placeholder; text
 * slots show one bar per line, and the container gets `aria-busy`. With `asChild` the single
 * child itself becomes one solid placeholder and no element is added, the escape hatch for
 * wrapping one part. Users who prefer reduced motion see a still placeholder. In server-rendered
 * HTML the loader already shows before any script runs; the live one replaces it after
 * hydration.
 *
 * Side effects: through core, adds inline styles and a stylesheet while loading and restores the
 * elements exactly when loading ends or on unmount.
 *
 * @param props - `loading`, the loader (`effect`, `preset`, `settings`, `layout`), `asChild`,
 *   `as`, `options`, the children and any attributes for the element.
 * @returns The container, or the child itself with `asChild`.
 */
export function Skeleton(props: SkeletonProps) {
  const {
    loading,
    effect,
    asChild = false,
    as = "div",
    options,
    preset,
    settings,
    layout,
    children,
    ...attributes
  } = props;
  const config: RevealConfig = {
    preset,
    layout,
    settings: { ...settings, ...(effect && { effect }) },
  };
  const key = configKey(config);
  // Latest values, read when the skeleton is created without making them dependencies.
  const latest = useRef({ config, options });
  latest.current = { config, options };

  const [element, setElement] = useState<HTMLElement | null>(null);
  const [skeleton, setSkeleton] = useState<CoreSkeleton | null>(null);

  // One skeleton per element and effect; a new one replaces the old after it restored the page.
  useEffect(() => {
    if (!element) return;
    const { config: current, options: currentOptions } = latest.current;
    // A list keeps the child a solid placeholder; a container looks for slots inside.
    const target = asChild ? [element] : element;
    const instance = createSkeleton(target, resolveConfig(current), currentOptions);
    setSkeleton(instance);
    return () => {
      instance.destroy();
      setSkeleton((now) => (now === instance ? null : now));
    };
  }, [element, key, asChild]);

  // The skeleton in server HTML, until the live one below takes over.
  const server = useServerSkeleton(loading, resolveConfig(config), asChild);

  useEffect(() => {
    if (!skeleton) return;
    if (loading) skeleton.start();
    else skeleton.stop();
    server.handOver();
  }, [skeleton, loading, server.handOver]);

  if (asChild)
    // The style goes next to the child, since nothing may be added inside it.
    return (
      <>
        {server.style}
        <Slot {...attributes} {...server.scope} ref={setElement}>
          {children}
        </Slot>
      </>
    );
  return createElement(
    as,
    { ...attributes, ...server.scope, ref: setElement },
    server.style,
    children,
  );
}
