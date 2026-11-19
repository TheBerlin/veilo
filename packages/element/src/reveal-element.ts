// reveal-element.ts: the <veilo-reveal> element. Shows the skeleton on the data-veilo-slot
// elements inside it while their content loads, then plays the reveal when loading ends.

import {
  createReveal,
  type Layout,
  type Reveal,
  type RevealOptions,
  type Settings,
} from "@veilo-ui/core";
import type { PresetId } from "@veilo-ui/presets";
import {
  ReactiveElement,
  type PropertyDeclarations,
  type PropertyValues,
} from "@lit/reactive-element";
import { configKey, resolveConfig, type RevealConfig } from "@veilo-ui/presets";
import { jsonAttribute } from "./config.ts";

/** Name of the DOM event fired each time a reveal finishes. */
export const COMPLETE_EVENT = "veilo-complete";

/**
 * `<veilo-reveal>`: while the `loading` attribute is present, every `data-veilo-slot` element
 * inside shows the skeleton (keep placeholder content in them meanwhile, so they have their real
 * size) and the element itself gets `aria-busy`. Removing `loading` plays the reveal once. Without
 * `loading` the content simply shows; `reveal-on-connect` plays the reveal when the element
 * enters the page instead. Users who prefer reduced motion see the content at once. The children
 * stay in the page (no shadow DOM), so page CSS keeps applying to them.
 *
 * Attributes: `loading`, `reveal-on-connect`, `preset`, `settings` and `layout` (JSON). Each has a
 * property (`revealOnConnect` for the second); `settings` and `layout` take objects there. The
 * `options` property (core reveal options) is read when the reveal is created, and `reveal` gives
 * the live core reveal for full control (play, seek, events).
 *
 * Events: `veilo-complete` (bubbles) each time a reveal finishes.
 *
 * Side effects: through core, adds canvases, overlays and a stylesheet; removing the element from
 * the page restores everything.
 */
export class VeiloRevealElement extends ReactiveElement {
  /** Lit's reactive properties and their attributes. */
  static override properties: PropertyDeclarations = {
    loading: { type: Boolean, reflect: true },
    revealOnConnect: { type: Boolean, attribute: "reveal-on-connect" },
    preset: {},
    settings: { converter: jsonAttribute },
    layout: { converter: jsonAttribute },
    options: { attribute: false },
  };

  /** Whether the content is loading: the skeleton shows while `true`; `false` plays the reveal. */
  declare loading: boolean;
  /** Play the reveal when the element enters the page (or after the effect changes). */
  declare revealOnConnect: boolean;
  /** A built-in preset. Unknown ids are ignored. */
  declare preset: PresetId | undefined;
  /** Settings to apply last, over the preset or the layout's settings. */
  declare settings: Partial<Settings> | undefined;
  /** A layout: base settings plus slot hints. */
  declare layout: Layout | undefined;
  /** Core reveal options (`ink`, `fontFamily`, `reducedMotion`, ...). Read when created. */
  declare options: RevealOptions | undefined;

  /** The live core reveal, while the element is in the page. */
  #reveal: Reveal | null = null;
  /** The config the live reveal was created from. */
  #key = "";
  /** Stops forwarding the live reveal's `complete` event. */
  #unsubscribe: (() => void) | null = null;

  constructor() {
    super();
    this.loading = false;
    this.revealOnConnect = false;
  }

  /** The live core reveal for full control, or null while the element is not in the page. */
  get reveal(): Reveal | null {
    return this.#reveal;
  }

  /**
   * Renders into the element itself, not a shadow root, so core works on the page's own
   * elements and page CSS keeps applying.
   *
   * @returns The element.
   */
  protected override createRenderRoot(): HTMLElement {
    return this;
  }

  /**
   * Back in the page after a move: ask for an update, which creates a new reveal.
   *
   * Side effects: schedules an update.
   */
  override connectedCallback(): void {
    super.connectedCallback();
    this.requestUpdate();
  }

  /**
   * Out of the page: the reveal is destroyed and the elements restored.
   *
   * Side effects: restores the DOM through core.
   */
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#destroy();
  }

  /**
   * Creates the reveal when there is none or its config changed, then shows the skeleton, plays,
   * or leaves the content as it is.
   *
   * Side effects: creates and destroys core reveals, which change the slots' DOM and styles.
   *
   * @param changed - The properties changed since the last update, with their old values.
   */
  protected override updated(changed: PropertyValues<this>): void {
    if (!this.isConnected) return;
    const config: RevealConfig = {
      preset: this.preset,
      layout: this.layout,
      settings: this.settings,
    };
    const key = configKey(config);
    const fresh = !this.#reveal || key !== this.#key;
    if (fresh) {
      // The old reveal restores the page before the new one reads it.
      this.#destroy();
      const reveal = createReveal(this, resolveConfig(config), this.options);
      this.#unsubscribe = reveal.on("complete", () => {
        this.dispatchEvent(new Event(COMPLETE_EVENT, { bubbles: true, composed: true }));
      });
      this.#reveal = reveal;
      this.#key = key;
    }
    const reveal = this.#reveal!;
    if (this.loading) {
      // Only on a change, so an unrelated update never restarts the skeleton.
      if (fresh || changed.has("loading")) reveal.showLoading();
    }
    // A new reveal plays only when asked; an existing one plays when loading has just ended.
    else if (fresh ? this.revealOnConnect : changed.get("loading") === true) void reveal.play();
  }

  /** Destroys the live reveal, if any. */
  #destroy(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#reveal?.destroy();
    this.#reveal = null;
  }
}
