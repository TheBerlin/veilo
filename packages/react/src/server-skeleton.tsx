// server-skeleton.tsx: the skeleton in server-rendered HTML. While loading, the server output
// and the first client render carry a scoped `<style>` from core's serverSkeletonCss; once the
// live skeleton runs, the component drops it. Internal, used by Reveal and Skeleton.

import { serverSkeletonCss, type Layout, type Settings } from "@veilo/core";
import { useCallback, useId, useState, type ReactNode } from "react";

/** The attribute that scopes the server stylesheet to one component. */
const SCOPE_ATTRIBUTE = "data-veilo-ssr";

/** What {@link useServerSkeleton} gives a component. */
export interface ServerSkeleton {
  /** Attributes for the scope element; empty once the live skeleton has taken over. */
  scope: Record<string, string>;
  /** The `<style>` to render next to (or inside) the scope element, or `null`. */
  style: ReactNode;
  /** Call once the live skeleton shows (or is not needed); removes the style and the scope. */
  handOver: () => void;
}

/**
 * Keeps the server skeleton until the live one takes over. The state starts from `loading` at
 * mount, so the server render and the first client render match (no hydration mismatch); a
 * component that mounts ready never renders it.
 *
 * `aria-busy` is not part of it on purpose: core sets it on the container itself, and an
 * attribute React added and later removed would erase core's value while it still loads.
 *
 * @param loading - Whether the content is loading at mount.
 * @param input - Settings or a layout for the stylesheet (core's input).
 * @param self - `true` when the scope element is itself the one placeholder.
 * @returns The scope attributes, the style element and the hand-over callback.
 */
export function useServerSkeleton(
  loading: boolean,
  input: Layout | Partial<Settings>,
  self = false,
): ServerSkeleton {
  // Stable across the server and the client, so both sides name the same scope.
  const id = useId();
  const [pending, setPending] = useState(loading);
  const handOver = useCallback(() => setPending(false), []);
  if (!pending) return { scope: {}, style: null, handOver };

  const css = serverSkeletonCss(input, `[${SCOPE_ATTRIBUTE}="${id}"]`, { self });
  return {
    scope: { [SCOPE_ATTRIBUTE]: id },
    // Raw CSS, not a text child: React would escape quotes, which a <style> does not decode.
    // The CSS is built by core, and slot names in it are escaped, so it cannot close the tag.
    style: <style dangerouslySetInnerHTML={{ __html: css }} />,
    handOver,
  };
}
