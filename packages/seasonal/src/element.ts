// element.ts: the web component of @veilo-ui/seasonal: `<veilo-seasonal-effect name="frost">`.
// The class is made inside `defineSeasonalEffect`, so importing this file in Node or on a server,
// where `HTMLElement` does not exist, is safe.

import type { FlakeShape } from "./flake.ts";
import { mountEffect, type EffectHandle, type EffectMode } from "./mount.ts";
import type { EffectId } from "./variants.ts";

/** The tag name of the element. */
export const SEASONAL_EFFECT_TAG = "veilo-seasonal-effect";

/**
 * Defines `<veilo-seasonal-effect>`. Attributes: `name` (the effect's id), `shape` (the flake
 * form), `mode` (`loop`, `hover` or `still`) and `label` (the accessible name). The element is
 * `display: block` and has no size of its own: give it a width and a height.
 *
 * Side effects: registers the custom element, once. Calling it again does nothing.
 *
 * @param registry - Where to define it; defaults to `customElements`.
 */
export function defineSeasonalEffect(registry: CustomElementRegistry = customElements): void {
  if (registry.get(SEASONAL_EFFECT_TAG)) return;
  class SeasonalEffectElement extends HTMLElement {
    static observedAttributes = ["name", "shape", "mode", "label"];
    private handle: EffectHandle | null = null;

    /** Mounts the effect when the element is added to the page. */
    connectedCallback(): void {
      if (!this.style.display) this.style.display = "block";
      this.mount();
    }

    /** Destroys the effect when the element is removed, so nothing keeps running. */
    disconnectedCallback(): void {
      this.handle?.destroy();
      this.handle = null;
    }

    /**
     * Reacts to a changed attribute: a new flake form is applied in place, anything else remounts.
     *
     * @param attribute - The attribute that changed.
     */
    attributeChangedCallback(attribute: string): void {
      if (!this.isConnected) return;
      if (attribute === "shape" && this.handle) {
        this.handle.setShape((this.getAttribute("shape") ?? "dendrite") as FlakeShape);
      } else {
        this.mount();
      }
    }

    /** (Re)mounts the effect from the attributes. */
    private mount(): void {
      this.handle?.destroy();
      this.handle = null;
      const name = this.getAttribute("name") as EffectId | null;
      if (!name) return;
      try {
        this.handle = mountEffect(this, name, {
          mode: (this.getAttribute("mode") ?? "loop") as EffectMode,
          shape: (this.getAttribute("shape") ?? "dendrite") as FlakeShape,
          label: this.getAttribute("label") ?? undefined,
        });
      } catch (error) {
        console.warn(`<${SEASONAL_EFFECT_TAG}>: ${(error as Error).message}`);
      }
    }
  }
  registry.define(SEASONAL_EFFECT_TAG, SeasonalEffectElement);
}
