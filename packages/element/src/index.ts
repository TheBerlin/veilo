// index.ts: the public entry `@veilo/element`. Web components over @veilo/core. Importing it
// registers nothing; call defineVeiloElements().

import type { VeiloSkeletonElement } from "./skeleton-element.ts";

export { defineVeiloElements, ELEMENT_TAGS } from "./define.ts";
export { VeiloSkeletonElement } from "./skeleton-element.ts";
export type { RevealConfig } from "./config.ts";

declare global {
  interface HTMLElementTagNameMap {
    "veilo-skeleton": VeiloSkeletonElement;
  }
}
