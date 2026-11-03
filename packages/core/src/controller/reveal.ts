// reveal.ts: createReveal, which plays the image, text and button reveal on real elements.
// Layer 3. The only stateful layer: owns the clock, the sequence, the skeleton, the effect
// canvas, the text overlays and every observer, and undoes all of them on destroy().

import { context2d, createCanvas, createCanvasElement, type Context2D } from "../dom/canvas.ts";
import { createCleanup, type Cleanup } from "../dom/cleanup.ts";
import { browserScheduler, pixelRatio, type Scheduler } from "../dom/env.ts";
import { loadFont } from "../dom/fonts.ts";
import { mountTextOverlay, type TextOverlay } from "../dom/overlay.ts";
import { prefersReducedMotion } from "../dom/reduced-motion.ts";
import { watchResize } from "../dom/resize.ts";
import { computedValue } from "../dom/style.ts";
import { watchVisibility } from "../dom/visibility.ts";
import { createElementSkeleton } from "../loader/skeleton.ts";
import { resolveEasing } from "../math/easing.ts";
import { coverCrop } from "../math/fit.ts";
import { clamp, cssNumber } from "../math/number.ts";
import { applyButtonFrame } from "../render/button-fx.ts";
// Types only: the renderer itself, with sampling and glyph ramps, is loaded with import() when a
// grid effect is used, so bundlers put it in a separate file the other effects never download.
import type * as GridRenderer from "../render/grid-renderer.ts";
import type { PreparedGrid } from "../render/grid-renderer.ts";
import { isGridStyle } from "../render/grid-style.ts";
import { applyImageFxFrame, imageFxFrame, isImageFxStyle } from "../render/image-fx.ts";
import {
  applyTextFxFrame,
  textFxConfig,
  textFxFrame,
  type TextFxFrame,
} from "../render/text-fx.ts";
import { isDevBuild } from "../slots/dev-warnings.ts";
import { photoOpacity } from "../timeline/reveal-timeline.ts";
import { createClock } from "./clock.ts";
import { createEmitter } from "./events.ts";
import { createSequence } from "./sequence.ts";
import { resolveTargets, type RevealTargets } from "./targets.ts";

/**
 * What the reveal shows: `idle` before anything ran, `loading` while the skeleton shows,
 * `revealing` while progress is below 1, `revealed` at the end.
 */
export type RevealState = "idle" | "loading" | "revealing" | "revealed";

export type { RevealTargets } from "./targets.ts";

/** Options for {@link createReveal}. */
export interface RevealOptions {
  /** Font family for hex and binary characters. Defaults to IBM Plex Mono. */
  fontFamily?: string;
  /** Color of dots and characters. Defaults to `--veilo-ink` on the image's parent, then its color. */
  ink?: string;
  /** Time source. Defaults to the browser's; tests pass a fake one. */
  scheduler?: Scheduler;
  /** Overrides the user's `prefers-reduced-motion`. The playground preview passes `false`. */
  reducedMotion?: boolean;
  /** The loading region, which gets `aria-busy` while the skeleton shows. */
  busy?: Element;
  /** The shadow root the elements live in, for the skeleton stylesheet. */
  root?: ShadowRoot;
  /** Print slot mismatches to the console. Defaults to on in development builds only. */
  warnings?: boolean;
}

/** Events of a reveal and their arguments. */
export type RevealEvents = {
  progress: [p: number];
  state: [state: RevealState];
  complete: [];
};

/** A reveal on a set of elements. */
export interface Reveal {
  /** The current state. */
  readonly state: RevealState;
  /** The current progress, from 0 to 1. */
  readonly progress: number;
  /** Resolves once the image is sampled. Never rejects; a broken image is simply not sampled. */
  readonly ready: Promise<void>;
  /**
   * Plays the reveal from `p = 0`.
   *
   * @returns Resolves `true` at `p = 1`, or `false` when interrupted by another call or destroy.
   */
  play(): Promise<boolean>;
  /** Pauses the reveal. Showing the element again does not resume it; only resume() does. */
  pause(): void;
  /** Resumes a paused reveal. */
  resume(): void;
  /** Stops playback and shows the exact frame at `p`. At `p = 1` the real content shows. */
  seek(p: number): void;
  /** Stops everything and shows the skeleton. */
  showLoading(): void;
  /** Shows loading for `hold` seconds, then plays; with `loop`, restarts 900 ms after the end. */
  playSequence(options?: { loop?: boolean }): void;
  /** Adds an event listener and returns a function that removes it. */
  on<Name extends keyof RevealEvents>(
    name: Name,
    listener: (...args: RevealEvents[Name]) => void,
  ): () => void;
  /** Cancels frames, timers and observers, removes canvases and overlays, restores the DOM. */
  destroy(): void;
}

// The spec's photo canvas is at least 160 px wide.
const MIN_CANVAS_WIDTH = 160;
const IMAGE_STYLES = ["opacity", "filter", "transform", "clip-path"];
const TEXT_STYLES = ["opacity", "transform", "filter"];

/**
 * Creates a reveal for the given elements.
 *
 * Nothing on the page changes until a method is called. Settings are plain JSON, validated and
 * clamped. The image is sampled once (and again when it resizes by 2 px or more, or when the
 * glyph font finishes loading). Playback pauses while the elements are off screen or the tab is
 * hidden. With reduced motion, play() jumps straight to the end.
 *
 * @example
 * ```ts
 * const reveal = createReveal(
 *   { image: photo, text: [title, price, label], button },
 *   { imageFx: "dots", textFx: "scramble", rDur: 1.04 },
 * );
 * reveal.playSequence();          // loading for `hold` seconds, then the reveal
 * reveal.on("complete", () => {});
 * reveal.destroy();               // restores the page exactly
 * ```
 *
 * @param targets - The image, text elements and button to animate.
 * @param settings - Settings as plain JSON.
 * @param options - Fonts, colors, time source and accessibility options.
 * @returns The reveal.
 */
export function createReveal(
  targets: RevealTargets | Element,
  settings: unknown,
  options: RevealOptions = {},
): Reveal {
  const resolved = resolveTargets(targets, settings, options.warnings ?? isDevBuild());
  const parsed = resolved.settings;
  const scheduler = options.scheduler ?? browserScheduler();
  const reducedMotion = options.reducedMotion ?? prefersReducedMotion();
  // Undefined means the renderer's default, IBM Plex Mono.
  const fontFamily = options.fontFamily;
  const { image, button } = resolved.targets;
  const texts = [...(resolved.targets.text ?? [])];
  const ease = resolveEasing(parsed, "r");
  const textConfig = textFxConfig(parsed, Math.max(1, texts.length));
  const gridStyle = image && isGridStyle(parsed.imageFx);
  const usesOverlay = textConfig.textFx === "scramble" || textConfig.textFx === "typewriter";
  // The button's label is the text element that is the button or sits inside it.
  const foundLabel = button ? texts.findIndex((t) => t === button || button.contains(t)) : -1;
  const labelIndex = foundLabel >= 0 ? foundLabel : texts.length - 1;

  const emitter = createEmitter<RevealEvents>();
  // Undone on destroy(): observers and the skeleton.
  const life = createCleanup();
  // Undone at p = 1 and when loading: the effect canvas, overlays and every style a frame wrote.
  const layers: Cleanup = createCleanup();

  const skeleton = createElementSkeleton(resolved.placeholders, parsed, {
    busy: options.busy ?? resolved.container,
    root: options.root,
    bars: resolved.bars,
  });
  life.add(() => skeleton.destroy());

  let state: RevealState = "idle";
  let progress = 0;
  let destroyed = false;
  let isReady = false;
  let userPaused = false;
  let hidden = false;
  // Bumped by every call that replaces what is playing, so a stale pending start is dropped.
  let token = 0;
  let pending: ((completed: boolean) => void) | undefined;

  let renderer: typeof GridRenderer | undefined;
  let grid: PreparedGrid | undefined;
  let gridSize = { width: 0, height: 0 };
  let mounted = false;
  let effectCanvas: HTMLCanvasElement | undefined;
  let effectContext: Context2D | undefined;
  let overlays: (TextOverlay | undefined)[] = [];
  let realText: string[] = [];
  let ink = "";

  const setState = (next: RevealState) => {
    if (state === next) return;
    state = next;
    emitter.emit("state", next);
  };

  /** Resolves the pending play() promise, if any. */
  const settle = (completed: boolean) => {
    const resolve = pending;
    pending = undefined;
    resolve?.(completed);
  };

  /**
   * Samples the image at its current size, drawn cover-fit. Sampling already treats transparent
   * pixels as white, which is the spec's white background.
   */
  const prepareGrid = () => {
    grid = undefined;
    if (!image || !gridStyle || !renderer) return;
    const box = image.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return;
    const width = Math.max(MIN_CANVAS_WIDTH, Math.round(box.width * pixelRatio()));
    const height = Math.max(1, Math.round((width * box.height) / box.width));
    const sourceWidth = "naturalWidth" in image ? image.naturalWidth : image.width;
    const sourceHeight = "naturalHeight" in image ? image.naturalHeight : image.height;
    if (sourceWidth <= 0 || sourceHeight <= 0) return;

    const photo = createCanvas(width, height);
    const context = context2d(photo);
    const crop = coverCrop(sourceWidth, sourceHeight, width, height);
    context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
    grid = renderer.prepareGridEffect(photo, parsed, { fontFamily });
    gridSize = { width, height };
  };

  /** Puts the effect canvas exactly over the image. */
  const placeCanvas = () => {
    if (!image || !effectCanvas) return;
    effectCanvas.width = gridSize.width;
    effectCanvas.height = gridSize.height;
    Object.assign(effectCanvas.style, {
      position: "absolute",
      left: `${image.offsetLeft}px`,
      top: `${image.offsetTop}px`,
      width: `${image.offsetWidth}px`,
      height: `${image.offsetHeight}px`,
      pointerEvents: "none",
    });
  };

  /** Records an inline style's original value, so frames can write it freely. */
  const remember = (element: HTMLElement, property: string) =>
    layers.style(element, property, element.style.getPropertyValue(property));

  /** Adds the effect layers before the first frame below 1. */
  const mount = () => {
    if (mounted) return;
    mounted = true;

    if (image) {
      for (const property of IMAGE_STYLES) remember(image, property);
      if (grid) {
        const parent = image.parentElement;
        if (parent && computedValue(parent, "position") === "static") {
          layers.style(parent, "position", "relative");
        }
        ink =
          options.ink ||
          computedValue(parent ?? image, "--veilo-ink") ||
          computedValue(parent ?? image, "color");
        const canvas = createCanvasElement(gridSize.width, gridSize.height);
        canvas.setAttribute("aria-hidden", "true");
        image.after(canvas);
        effectCanvas = canvas;
        effectContext = context2d(canvas);
        placeCanvas();
        layers.add(() => canvas.remove());
      }
    }

    realText = texts.map((element) => element.textContent ?? "");
    overlays = texts.map((element) => {
      for (const property of TEXT_STYLES) remember(element, property);
      if (!usesOverlay) return undefined;
      const overlay = mountTextOverlay(element);
      layers.add(() => overlay.unmount());
      return overlay;
    });
    if (button) remember(button, "--veilo-bg-a");

    layers.add(() => {
      mounted = false;
      effectCanvas = undefined;
      effectContext = undefined;
      overlays = [];
    });
  };

  /** Draws every part at progress `p`. At 1 the layers go and the real content shows. */
  const draw = (p: number) => {
    progress = p;
    if (p >= 1) {
      layers.run();
    } else {
      mount();
      if (image && grid && effectContext && renderer) {
        renderer.drawGridFrame(effectContext, grid, { ink }, p);
        image.style.opacity = cssNumber(photoOpacity(p));
      } else if (image && isImageFxStyle(parsed.imageFx)) {
        applyImageFxFrame(image, imageFxFrame(parsed.imageFx, parsed.origin, ease, p));
      }
      const frames: TextFxFrame[] = texts.map((element, i) => {
        const frame = textFxFrame(textConfig, realText[i] ?? "", i, p);
        applyTextFxFrame(element, frame, overlays[i]);
        return frame;
      });
      if (button) applyButtonFrame(button, frames[labelIndex]?.eased ?? clamp(ease(p)));
    }
    emitter.emit("progress", p);
  };

  const clock = createClock({
    duration: parsed.rDur,
    scheduler,
    onFrame: draw,
    onEnd: () => {
      setState("revealed");
      emitter.emit("complete");
      settle(true);
      sequence.revealEnded();
    },
  });

  const startReveal = () => {
    skeleton.stop();
    userPaused = false;
    setState("revealing");
    if (reducedMotion) {
      clock.start(1);
      return;
    }
    clock.start(0);
    if (hidden) clock.pause();
  };

  /** Starts the reveal once the image is sampled, unless something replaced it meanwhile. */
  const startWhenReady = () => {
    const mine = ++token;
    void ready.then(() => {
      if (mine === token && !destroyed) startReveal();
    });
  };

  const enterLoading = () => {
    clock.stop();
    layers.run();
    progress = 0;
    skeleton.start();
    setState("loading");
  };

  const sequence = createSequence({
    scheduler,
    hold: parsed.hold,
    showLoading: enterLoading,
    startReveal: startWhenReady,
  });

  const ready = (async () => {
    try {
      if (image && gridStyle) {
        // Loads the grid code while the image decodes, so the split adds no waiting.
        const [loaded] = await Promise.all([
          import("../render/grid-renderer.ts"),
          "decode" in image ? image.decode() : undefined,
        ]);
        renderer = loaded;
        if (destroyed) return;
        prepareGrid();
        life.add(
          watchResize(image, () => {
            prepareGrid();
            if (mounted) {
              placeCanvas();
              draw(progress);
            }
          }),
        );
        const font = grid?.ramp?.font;
        if (font) {
          void loadFont(font).then((loaded) => {
            if (!loaded || destroyed) return;
            prepareGrid();
            if (mounted) draw(progress);
          });
        }
      }
    } catch {
      // An image that cannot be decoded, or grid code that cannot load, leaves the image as it is.
      grid = undefined;
    } finally {
      isReady = true;
    }
  })();

  const watched = image ?? texts[0] ?? button;
  if (watched) {
    life.add(
      watchVisibility(watched, (visible) => {
        hidden = !visible;
        if (hidden) clock.pause();
        else if (!userPaused && state === "revealing") clock.resume();
      }),
    );
  }

  /** Cancels whatever is playing or scheduled, before another action takes over. */
  const interrupt = () => {
    token++;
    sequence.cancel();
    settle(false);
  };

  return {
    get state() {
      return state;
    },
    get progress() {
      return progress;
    },
    ready,

    play() {
      if (destroyed) return Promise.resolve(false);
      interrupt();
      const result = new Promise<boolean>((resolve) => (pending = resolve));
      startWhenReady();
      return result;
    },

    pause() {
      userPaused = true;
      clock.pause();
    },

    resume() {
      userPaused = false;
      if (!hidden) clock.resume();
    },

    seek(p) {
      if (destroyed) return;
      interrupt();
      clock.stop();
      skeleton.stop();
      const target = clamp(p);
      const show = () => {
        if (destroyed) return;
        setState(target >= 1 ? "revealed" : "revealing");
        clock.seek(target);
      };
      if (isReady) show();
      else void ready.then(show);
    },

    showLoading() {
      if (destroyed) return;
      interrupt();
      enterLoading();
    },

    playSequence({ loop = false } = {}) {
      if (destroyed) return;
      interrupt();
      sequence.run(loop);
    },

    on: emitter.on,

    destroy() {
      if (destroyed) return;
      destroyed = true;
      interrupt();
      clock.stop();
      layers.run();
      life.run();
      emitter.clear();
    },
  };
}
