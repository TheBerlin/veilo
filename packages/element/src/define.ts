// define.ts: registers the elements under their tag names.

import { VeiloSkeletonElement } from "./skeleton-element.ts";

/** The tag names the elements are registered under. */
export const ELEMENT_TAGS = {
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
  if (!registry.get(ELEMENT_TAGS.skeleton)) {
    registry.define(ELEMENT_TAGS.skeleton, VeiloSkeletonElement);
  }
}
