/**
 * reduced-motion.ts: reads the user's reduced motion preference.
 * Layer 1 (browser). Touches browser globals only when called, never at import time.
 */

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Tells whether the user asked the system for less motion.
 *
 * @returns `true` when `prefers-reduced-motion: reduce` matches. `false` without a `window`.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(QUERY).matches;
}
