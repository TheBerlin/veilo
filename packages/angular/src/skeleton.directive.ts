// skeleton.directive.ts: the `veiloSkeleton` directive, which runs core's loader on the element
// it is put on. The `veilo-skeleton` component is a wrapper over it.

import {
  afterNextRender,
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  signal,
  untracked,
} from "@angular/core";
import {
  createSkeleton,
  type Settings,
  type Skeleton as CoreSkeleton,
  type SkeletonOptions,
} from "@veilo/core";
import { configKey, resolveConfig, type LayoutInput, type PresetId } from "@veilo/presets";

/**
 * Runs a Veilo loader (shimmer, wave or pulse) on an element while `loading` is `true`. By
 * default every `data-veilo-slot` element inside becomes a placeholder, text slots show one bar
 * per line, and the element gets `aria-busy`. With `self` the element itself becomes one solid
 * placeholder, the escape hatch for wrapping one part. Users who prefer reduced motion see a
 * still placeholder. When loading ends, or the element goes, the elements are restored exactly.
 *
 * Runs outside Angular's zone and starts after the first render, so it does nothing on the
 * server.
 *
 * Side effects: through core, adds inline styles and a stylesheet while loading.
 *
 * Inputs: `loading` (required), `effect` (shortcut for the loader effect; wins over `preset` and
 * `settings`), `preset`, `settings`, `layout`, `self` and `options` (core skeleton options, read
 * when created).
 */
@Directive({
  selector: "[veiloSkeleton]",
  exportAs: "veiloSkeleton",
})
export class VeiloSkeletonDirective {
  /** Whether the content is loading: `true` shows the loader, `false` restores the elements. */
  readonly loading = input.required<boolean>();
  /** Shortcut for the loader effect; wins over `preset` and `settings`. */
  readonly effect = input<Settings["effect"] | undefined>(undefined);
  /** A built-in preset. Replaces the layout's settings; `settings` still apply on top. */
  readonly preset = input<PresetId | undefined>(undefined);
  /** Settings to apply last, over the preset or the layout's settings. */
  readonly settings = input<Partial<Settings> | undefined>(undefined);
  /** Slot roles and bar hints, plus base settings (only the keys you change). */
  readonly layout = input<LayoutInput | undefined>(undefined);
  /** Make the element itself one solid placeholder, instead of the slots inside it. */
  readonly self = input(false);
  /** Core skeleton options (`busy`, `root`, `warnings`, fallback colors). Read when created. */
  readonly options = input<SkeletonOptions | undefined>(undefined);

  private readonly instance = signal<CoreSkeleton | null>(null);

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const zone = inject(NgZone);
    const browser = signal(false);
    afterNextRender(() => browser.set(true));

    /** The effect config: the `effect` shortcut wins over `settings`. */
    const config = () => {
      const shortcut = this.effect();
      return {
        preset: this.preset(),
        layout: this.layout(),
        settings: { ...this.settings(), ...(shortcut && { effect: shortcut }) },
      };
    };
    // The skeleton is rebuilt only when this really changes.
    const key = computed(() =>
      browser() ? `${this.self() ? "self" : "slots"}|${configKey(config())}` : null,
    );

    // One skeleton per element and effect; a new one replaces the old after it restored the page.
    effect((onCleanup) => {
      if (key() === null) return;
      const { settings, self, options } = untracked(() => ({
        settings: resolveConfig(config()),
        self: this.self(),
        options: this.options(),
      }));
      // A list keeps the element a solid placeholder; an element alone looks for slots inside.
      const created = zone.runOutsideAngular(() =>
        createSkeleton(self ? [element] : element, settings, options),
      );
      this.instance.set(created);
      onCleanup(() => {
        created.destroy();
        this.instance.set(null);
      });
    });

    effect(() => {
      const current = this.instance();
      const loading = this.loading();
      if (!current) return;
      zone.runOutsideAngular(() => (loading ? current.start() : current.stop()));
    });
  }
}
