// components.ts: the standalone components `veilo-reveal` and `veilo-skeleton`. Each is a block
// element that shows its content and applies the matching directive to itself, so there is no
// extra wrapper element.

import { ChangeDetectionStrategy, Component } from "@angular/core";
import { VeiloRevealDirective } from "./reveal.directive";
import { VeiloSkeletonDirective } from "./skeleton.directive";

/**
 * Wraps content in a block element and runs a Veilo reveal on the `data-veilo-slot` elements
 * inside it: `<veilo-reveal [ready]="loaded">…</veilo-reveal>`. Takes the inputs and the
 * `complete` output of {@link VeiloRevealDirective}. The element is `display: block`; style it
 * like any element, for example with a class.
 */
@Component({
  selector: "veilo-reveal",
  template: "<ng-content />",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: "display: block" },
  hostDirectives: [
    {
      directive: VeiloRevealDirective,
      inputs: ["ready", "preset", "settings", "layout", "revealOnMount", "options"],
      outputs: ["complete"],
    },
  ],
})
export class VeiloReveal {}

/**
 * Shows a Veilo loader on the `data-veilo-slot` elements inside it while `loading` is true:
 * `<veilo-skeleton [loading]="!user" effect="wave">…</veilo-skeleton>`. Takes the inputs of
 * {@link VeiloSkeletonDirective}. The element is `display: block`.
 */
@Component({
  selector: "veilo-skeleton",
  template: "<ng-content />",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: "display: block" },
  hostDirectives: [
    {
      directive: VeiloSkeletonDirective,
      inputs: ["loading", "effect", "preset", "settings", "layout", "self", "options"],
    },
  ],
})
export class VeiloSkeleton {}
