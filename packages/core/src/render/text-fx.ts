/**
 * text-fx.ts: the card text reveals (scramble, typewriter, rise and sharpen, fade).
 * Layer 2. Writes text and inline styles on elements it is given; no timers.
 */

import type { TextOverlay } from "../dom/overlay.ts";
import { resolveEasing, type EasingFunction } from "../math/easing.ts";
import { clamp, cssNumber } from "../math/number.ts";
import { hash } from "../math/random.ts";
import type { Settings } from "../schema/types.ts";
import { textProgress } from "../timeline/text-windows.ts";

/** The scramble character sets, as the spec lists them. */
export const SCRAMBLE_CHARSETS: Readonly<Record<Settings["charset"], string>> = {
  hex: "0123456789ABCDEF-_.~",
  binary: "01",
  symbols: "#%&@$*+=?<>/|",
  dots: "●•∙·",
};

/** The text settings, gathered once so frames do not read the whole settings object. */
export interface TextFxConfig {
  textFx: Settings["textFx"];
  /** The scramble characters, one code point each. */
  charset: readonly string[];
  unit: Settings["unit"];
  /** The reveal easing. */
  ease: EasingFunction;
  /** The `rDur` setting, in seconds. */
  rDur: number;
  /** How many text elements share the timeline. */
  count: number;
}

/** One text element at one frame. Empty style strings mean the property is not set. */
export interface TextFxFrame {
  /** What the overlay shows, or `null` for effects without an overlay. */
  overlay: string | null;
  opacity: string;
  transform: string;
  filter: string;
  /** The eased progress, from 0 to 1. The button background follows its label's value. */
  eased: number;
}

// Scramble characters change every 60 ms of reveal time.
const TICK_SECONDS = 0.06;
const CARET = "▍";
// Rise and sharpen starts 10 px low and 3 px blurred.
const RISE_PX = 10;
const RISE_BLUR_PX = 3;
const WHITESPACE = /\s/;

/**
 * Gathers the text settings for {@link textFxFrame}.
 *
 * @param settings - The settings.
 * @param count - How many text elements share the timeline, at least 1.
 * @returns The config.
 */
export function textFxConfig(settings: Settings, count: number): TextFxConfig {
  return {
    textFx: settings.textFx,
    charset: Array.from(SCRAMBLE_CHARSETS[settings.charset]),
    unit: settings.unit,
    ease: resolveEasing(settings, "r"),
    rDur: settings.rDur,
    count,
  };
}

/**
 * Finds the scramble time step at a reveal progress.
 *
 * @param p - Reveal progress, from 0 to 1.
 * @param rDur - Reveal duration in seconds.
 * @returns The 60 ms step number. Equal progress always gives an equal step.
 */
export function scrambleTick(p: number, rDur: number): number {
  return Math.floor((p * rDur) / TICK_SECONDS);
}

/**
 * Builds the scrambled text for one frame.
 *
 * Unresolved characters are picked by a hash of the element, the character position and the
 * time step, so a frame never depends on earlier frames. Whitespace is never scrambled.
 *
 * @param text - The real text.
 * @param e - Eased progress, from 0 to 1.
 * @param unit - `char` resolves non-space character `k` of `N` at `e >= (k + 1) / N`; `word`
 *   does the same for whole words in reading order.
 * @param charset - The scramble characters, one code point each.
 * @param element - The element's index, so elements scramble differently.
 * @param tick - The step from {@link scrambleTick}.
 * @returns The text to show, with the same number of code points as `text`.
 */
export function scrambleText(
  text: string,
  e: number,
  unit: Settings["unit"],
  charset: readonly string[],
  element: number,
  tick: number,
): string {
  // Code points, so a character outside the Basic Multilingual Plane is never split in two.
  const chars = Array.from(text);

  // Number each non-space character (char mode) or word (word mode) in reading order.
  const units: number[] = [];
  let total = 0;
  let inWord = false;
  for (const ch of chars) {
    const space = WHITESPACE.test(ch);
    if (unit === "char") {
      units.push(space ? -1 : total++);
    } else {
      if (!space && !inWord) total++;
      inWord = !space;
      units.push(space ? -1 : total - 1);
    }
  }

  return chars
    .map((ch, i) => {
      const k = units[i] as number;
      if (k < 0 || e >= (k + 1) / total) return ch;
      return charset[Math.floor(hash(element, i, tick) * charset.length)] as string;
    })
    .join("");
}

/**
 * Builds the typewriter text for one frame.
 *
 * @param text - The real text.
 * @param e - Eased progress, from 0 to 1.
 * @param tp - The element's progress before easing. The caret shows while it is between 0 and 1.
 * @returns The first `round(e x length)` characters, plus a block caret mid-animation.
 */
export function typewriterText(text: string, e: number, tp: number): string {
  const chars = Array.from(text);
  const typed = chars.slice(0, Math.round(e * chars.length)).join("");
  return tp > 0 && tp < 1 ? typed + CARET : typed;
}

/**
 * Computes one text element's frame.
 *
 * Eased progress is clamped to 0 to 1, so an overshooting curve never over-fades or rises past
 * the element's place.
 *
 * @param config - From {@link textFxConfig}.
 * @param text - The element's real text.
 * @param index - The element's position on the text timeline, where the first is 0.
 * @param p - Reveal progress, from 0 to 1.
 * @returns The frame.
 */
export function textFxFrame(
  config: TextFxConfig,
  text: string,
  index: number,
  p: number,
): TextFxFrame {
  const tp = textProgress(p, index, config.count);
  const e = clamp(config.ease(tp));
  const frame: TextFxFrame = { overlay: null, opacity: "", transform: "", filter: "", eased: e };

  switch (config.textFx) {
    case "scramble":
      frame.overlay = scrambleText(
        text,
        e,
        config.unit,
        config.charset,
        index,
        scrambleTick(p, config.rDur),
      );
      break;
    case "typewriter":
      frame.overlay = typewriterText(text, e, tp);
      break;
    case "rise":
      frame.opacity = cssNumber(e);
      frame.transform = `translateY(${cssNumber((1 - e) * RISE_PX)}px)`;
      frame.filter = `blur(${cssNumber((1 - e) * RISE_BLUR_PX)}px)`;
      break;
    case "fade":
      frame.opacity = cssNumber(e);
      break;
  }
  return frame;
}

/**
 * Writes a frame on a text element and its overlay. Empty style values remove the inline
 * property; restoring the element's own inline styles afterwards is the controller's job.
 *
 * @param element - The text element.
 * @param frame - From {@link textFxFrame}.
 * @param overlay - The element's overlay from `mountTextOverlay` in dom/, for scramble and
 *   typewriter.
 */
export function applyTextFxFrame(
  element: HTMLElement,
  frame: TextFxFrame,
  overlay?: TextOverlay,
): void {
  const { style } = element;
  style.opacity = frame.opacity;
  style.transform = frame.transform;
  style.filter = frame.filter;
  if (overlay) overlay.overlay.textContent = frame.overlay ?? "";
}
