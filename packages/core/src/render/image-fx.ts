/**
 * image-fx.ts: the photo reveals without a grid (crossfade, blur-up, zoom in and wipe).
 * Layer 2. Works with CSS on the photo element; no canvas, timers or state between frames.
 */

import type { EasingFunction } from "../math/easing.ts";
import { clamp, cssNumber } from "../math/number.ts";
import type { Settings } from "../schema/types.ts";

/** The image effects done with CSS on the photo itself. */
export type ImageFxStyle = "crossfade" | "blur" | "zoom" | "wipe";

/**
 * The photo's inline styles at one frame. An empty string means the property is not set, so
 * the photo's own stylesheet applies.
 */
export interface ImageFxFrame {
  opacity: string;
  filter: string;
  transform: string;
  clipPath: string;
}

const IMAGE_FX_STYLES: readonly string[] = ["crossfade", "blur", "zoom", "wipe"];

// Blur-up starts this blurred and this much larger.
const BLUR_PX = 18;
const BLUR_SCALE = 0.06;
// Zoom in starts this much larger.
const ZOOM_SCALE = 0.35;
// The wipe circle's final radius, in CSS's reference radius for `circle()`. A corner sits at
// about 70.7%, so 75% covers the whole photo.
const WIPE_CIRCLE = 75;
// The wipe triangle's legs end at twice the photo size, so the long edge clears the far corner.
const WIPE_TRIANGLE = 200;

/**
 * Tells whether an image effect is done with CSS on the photo, without a grid.
 *
 * @param imageFx - The `imageFx` setting.
 * @returns `true` for `crossfade`, `blur`, `zoom` and `wipe`.
 */
export function isImageFxStyle(imageFx: Settings["imageFx"]): imageFx is ImageFxStyle {
  return IMAGE_FX_STYLES.includes(imageFx);
}

/**
 * Builds the wipe's clip-path for an origin.
 *
 * @param origin - Where the wipe starts.
 * @param e - Eased progress, clamped to 0 to 1.
 * @returns The clip-path, or an empty string for `random`, which fades instead.
 */
function wipeClipPath(origin: Settings["origin"], e: number): string {
  // How much of the photo is still hidden, as a percentage of its size.
  const hidden = `${cssNumber((1 - e) * 100)}%`;
  switch (origin) {
    case "left":
      return `inset(0 ${hidden} 0 0)`;
    case "right":
      return `inset(0 0 0 ${hidden})`;
    case "top":
      return `inset(0 0 ${hidden} 0)`;
    case "bottom":
      return `inset(${hidden} 0 0 0)`;
    case "center":
      return `circle(${cssNumber(e * WIPE_CIRCLE)}% at 50% 50%)`;
    case "diagonal": {
      const leg = `${cssNumber(e * WIPE_TRIANGLE)}%`;
      return `polygon(0 0, ${leg} 0, 0 ${leg})`;
    }
    case "random":
      return "";
  }
}

/**
 * Computes the photo's styles for an image effect at progress `p`.
 *
 * `E = ease(p)` is clamped to 0 to 1 everywhere except the zoom scale, as the spec notes, so an
 * overshooting curve can briefly zoom below 1 but never over-fade or over-wipe. At `p = 1` every
 * effect shows the plain photo.
 *
 * @param imageFx - The effect.
 * @param origin - The `origin` setting, used by `wipe`.
 * @param ease - The reveal easing.
 * @param p - Reveal progress, from 0 to 1.
 * @returns The four inline styles to apply.
 */
export function imageFxFrame(
  imageFx: ImageFxStyle,
  origin: Settings["origin"],
  ease: EasingFunction,
  p: number,
): ImageFxFrame {
  const eased = ease(p);
  const e = clamp(eased);
  const frame: ImageFxFrame = { opacity: "", filter: "", transform: "", clipPath: "" };

  switch (imageFx) {
    case "crossfade":
      frame.opacity = cssNumber(e);
      break;
    case "blur":
      frame.opacity = cssNumber(e);
      frame.filter = `blur(${cssNumber((1 - e) * BLUR_PX)}px)`;
      frame.transform = `scale(${cssNumber(1 + (1 - e) * BLUR_SCALE)})`;
      break;
    case "zoom":
      frame.opacity = cssNumber(e);
      // Not clamped: overshoot easing carries through, so the photo can dip below scale 1.
      frame.transform = `scale(${cssNumber(1 + (1 - eased) * ZOOM_SCALE)})`;
      break;
    case "wipe":
      frame.clipPath = wipeClipPath(origin, e);
      if (origin === "random") frame.opacity = cssNumber(e);
      break;
  }
  return frame;
}

/**
 * Writes a frame's styles on the photo element. Empty values remove the inline property.
 *
 * Restoring the photo's original inline styles after the reveal is the controller's job.
 *
 * @param element - The photo element.
 * @param frame - From {@link imageFxFrame}.
 */
export function applyImageFxFrame(element: ElementCSSInlineStyle, frame: ImageFxFrame): void {
  const { style } = element;
  style.opacity = frame.opacity;
  style.filter = frame.filter;
  style.transform = frame.transform;
  style.clipPath = frame.clipPath;
}
