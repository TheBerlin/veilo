// skeleton-element.ts: the <veilo-skeleton> element. Shows the loader (shimmer, wave or pulse)
// on the data-veilo-slot elements inside it while their content loads, with no reveal afterwards.

import {
  createSkeleton,
  type Layout,
  type Settings,
  type Skeleton,
  type SkeletonOptions,
} from "@veilo/core";
import type { PresetId } from "@veilo/presets";
import { ReactiveElement, type PropertyDeclarations } from "@lit/reactive-element";
import { configKey, resolveConfig, type RevealConfig } from "@veilo/presets";
import { jsonAttribute } from "./config.ts";

/**
 * `<veilo-skeleton>`: every `data-veilo-slot` element inside becomes a placeholder while the
 * `loading` attribute is present; text slots show one bar per line, and the element itself gets
 * `aria-busy`. Removing `loading` restores the elements exactly. Users who prefer reduced motion
 * see a still placeholder. The children stay in the page (no shadow DOM), so page CSS keeps
 * applying to them.
 *
 * Attributes: `loading`, `effect` (`shimmer`, `wave` or `pulse`; wins over the others),
 * `preset`, `settings` and `layout` (JSON). Each has a property of the same name; `settings` and
 * `layout` take objects there. The `options` property (core skeleton options) is read when the
 * loader is created.
 *
 * Side effects: through core, adds inline styles and a stylesheet while loading; removing the
 * element from the page restores everything.
 */
export class VeiloSkeletonElement extends ReactiveElement {
  /** Lit's reactive properties and their attributes. */
  static override properties: PropertyDeclarations = {
    loading: { type: Boolean, reflect: true },
    effect: {},
    preset: {},
    settings: { converter: jsonAttribute },
    layout: { converter: jsonAttribute },
    options: { attribute: false },
  };

  /** Whether the content is loading: the loader shows while `true`. */
  declare loading: boolean;
  /** Shortcut for the loader effect; wins over `preset` and `settings`. */
  declare effect: Settings["effect"] | undefined;
  /** A built-in preset. Unknown ids are ignored. */
  declare preset: PresetId | undefined;
  /** Settings to apply last, over the preset or the layout's settings. */
  declare settings: Partial<Settings> | undefined;
  /** A layout: base settings plus slot hints. */
  declare layout: Layout | undefined;
  /** Core skeleton options (`busy`, `root`, `warnings`, fallback colors). Read when created. */
  declare options: SkeletonOptions | undefined;

  /** The live core loader, while the element is in the page. */
  #skeleton: Skeleton | null = null;
  /** The config the live loader was created from. */
  #key = "";

  constructor() {
    super();
    this.loading = false;
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
   * Back in the page after a move: ask for an update, which creates a new loader.
   *
   * Side effects: schedules an update.
   */
  override connectedCallback(): void {
    super.connectedCallback();
    this.requestUpdate();
  }

  /**
   * Out of the page: the loader is destroyed and the elements restored.
   *
   * Side effects: restores the DOM through core.
   */
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#destroy();
  }

  /**
   * Creates the loader when there is none or its config changed, then starts or stops it.
   *
   * Side effects: creates and destroys core loaders, which change the slots' styles.
   */
  protected override updated(): void {
    if (!this.isConnected) return;
    const config: RevealConfig = {
      preset: this.preset,
      layout: this.layout,
      settings: { ...this.settings, ...(this.effect && { effect: this.effect }) },
    };
    const key = configKey(config);
    if (!this.#skeleton || key !== this.#key) {
      // The old loader restores the page before the new one reads it.
      this.#destroy();
      this.#skeleton = createSkeleton(this, resolveConfig(config), this.options);
      this.#key = key;
    }
    if (this.loading) this.#skeleton.start();
    else this.#skeleton.stop();
  }

  /** Destroys the live loader, if any. */
  #destroy(): void {
    this.#skeleton?.destroy();
    this.#skeleton = null;
  }
}
