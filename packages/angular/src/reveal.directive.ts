// reveal.directive.ts: the `veiloReveal` directive, which runs core's reveal on the element it
// is put on. The `veilo-reveal` component is a wrapper over it.

import {
  afterNextRender,
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  output,
  signal,
  untracked,
} from "@angular/core";
import { createReveal, type Reveal, type RevealOptions, type Settings } from "@veilo/core";
import { configKey, resolveConfig, type LayoutInput, type PresetId } from "@veilo/presets";

/**
 * Runs a Veilo reveal on an element that holds `data-veilo-slot` parts. While `ready` is
 * `false` the parts show the skeleton (render placeholder data meanwhile, so they have their
 * real size) and the element gets `aria-busy`; when it turns `true` the reveal plays once. Users
 * who prefer reduced motion see the content at once. The reveal is rebuilt when the effect
 * changes (compared by value) and destroyed with the element, which restores it exactly.
 *
 * Everything runs outside Angular's zone: the animation never triggers change detection. The
 * `complete` output is emitted inside the zone, so handlers update the view as usual. Nothing is
 * created on the server: the effect starts after the first render in the browser.
 *
 * Side effects: through core, adds canvases, overlays and a stylesheet while the element is on
 * the page and removes them when it goes.
 *
 * Inputs: `ready` (required), `preset`, `settings`, `layout`, `revealOnMount` (play when `ready`
 * is already true at the start; off by default) and `options` (core reveal options, read when
 * the reveal is created). Output: `complete`, each time a reveal finishes.
 */
@Directive({
  selector: "[veiloReveal]",
  exportAs: "veiloReveal",
})
export class VeiloRevealDirective {
  /** Whether the content is ready: `false` shows the skeleton, turning `true` plays it. */
  readonly ready = input.required<boolean>();
  /** A built-in preset. Replaces the layout's settings; `settings` still apply on top. */
  readonly preset = input<PresetId | undefined>(undefined);
  /** Settings to apply last, over the preset or the layout's settings. */
  readonly settings = input<Partial<Settings> | undefined>(undefined);
  /** Slot roles and bar hints, plus base settings (only the keys you change). */
  readonly layout = input<LayoutInput | undefined>(undefined);
  /** Play when `ready` is already `true` at the start. Off: content that was there just shows. */
  readonly revealOnMount = input(false);
  /** Core reveal options (`ink`, `fontFamily`, `reducedMotion`, ...). Read when created. */
  readonly options = input<RevealOptions | undefined>(undefined);
  /** Emitted each time a reveal finishes. */
  readonly complete = output<void>();

  private readonly instance = signal<Reveal | null>(null);

  /** The live core reveal for imperative control, or `null` before the first render and after
   * destroy. Read it in an effect or a template; `null` on the server. */
  readonly reveal = this.instance.asReadonly();

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const zone = inject(NgZone);
    const browser = signal(false);
    // Starts after the first render, which only happens in the browser.
    afterNextRender(() => browser.set(true));

    // The effect's identity: the reveal is rebuilt only when this really changes.
    const key = computed(() =>
      browser()
        ? configKey({ preset: this.preset(), settings: this.settings(), layout: this.layout() })
        : null,
    );

    // One reveal per element and effect; the cleanup restores the page before a new one starts.
    effect((onCleanup) => {
      if (key() === null) return;
      const { config, options } = untracked(() => ({
        config: { preset: this.preset(), settings: this.settings(), layout: this.layout() },
        options: this.options(),
      }));
      const created = zone.runOutsideAngular(() =>
        createReveal(element, resolveConfig(config), options),
      );
      // Handlers run in the zone, so a `(complete)` listener updates the view as usual.
      const unsubscribe = created.on("complete", () => zone.run(() => this.complete.emit()));
      this.instance.set(created);
      onCleanup(() => {
        unsubscribe();
        created.destroy();
        this.instance.set(null);
      });
    });

    // The reveal `sync` last saw, and whether the content was ready then.
    let seen: { reveal: Reveal | null; ready: boolean } | null = null;
    effect(() => {
      const current = this.instance();
      const ready = this.ready();
      if (!current) return;
      // The first run starts from the readiness at the time the reveal was made.
      const previous = seen ?? { reveal: null, ready };
      const first = previous.reveal !== current;
      seen = { reveal: current, ready };
      zone.runOutsideAngular(() => {
        if (!ready) current.showLoading();
        // Plays when the content has just become ready; a new reveal for content that was ready
        // already (the first one, or after an effect change) plays only when asked.
        else if (!previous.ready || (first && untracked(this.revealOnMount))) void current.play();
      });
    });
  }
}
