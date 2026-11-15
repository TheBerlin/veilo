// define.ts: registers the elements under their tag names.

import { VeiloRevealElement } from "./reveal-element.ts";
import { VeiloSkeletonElement } from "./skeleton-element.ts";

/** The tag names the elements are registered under. */
export const ELEMENT_TAGS = {
  reveal: "veilo-reveal",
  skeleton: "veilo-skeleton",
} as const;

/**
 * Registers the Veilo elements with a custom element registry. Safe to call more than once; a
 * tag that is already registered is left as it is.
 *
 * Side effects: defines custom elements on the registry.
 *
 * @param registry - The registry to use. Defaults to the global `customElements`.
 */
export function defineVeiloElements(registry: CustomElementRegistry = customElements): void {
  const elements = [
    [ELEMENT_TAGS.reveal, VeiloRevealElement],
    [ELEMENT_TAGS.skeleton, VeiloSkeletonElement],
  ] as const;
  for (const [tag, element] of elements) {
    if (!registry.get(tag)) registry.define(tag, element);
  }
}
