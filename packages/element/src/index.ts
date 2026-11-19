// index.ts: the public entry `@veilo-ui/element`. Web components over @veilo-ui/core. Importing it
// registers nothing; call defineVeiloElements().

import type { VeiloRevealElement } from "./reveal-element.ts";
import type { VeiloSkeletonElement } from "./skeleton-element.ts";

export { defineVeiloElements, ELEMENT_TAGS } from "./define.ts";
export { COMPLETE_EVENT, VeiloRevealElement } from "./reveal-element.ts";
export { VeiloSkeletonElement } from "./skeleton-element.ts";
export type { RevealConfig } from "@veilo-ui/presets";

declare global {
  interface HTMLElementTagNameMap {
    "veilo-reveal": VeiloRevealElement;
    "veilo-skeleton": VeiloSkeletonElement;
  }
}
