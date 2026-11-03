/**
 * button-fx.ts: fades the button background in with its label.
 * Layer 2. Writes one custom property on the element it is given.
 */

import { clamp, cssNumber } from "../math/number.ts";

/** The custom property the button's own CSS reads for its background alpha. */
export const BUTTON_ALPHA_PROPERTY = "--veilo-bg-a";

/**
 * Sets the button background's alpha for one frame.
 *
 * The button's CSS must use the property, for example `rgb(3 3 3 / var(--veilo-bg-a, 1))`; the
 * fallback keeps the button solid when no reveal runs. Removing the property after the reveal
 * is the controller's job.
 *
 * @param button - The button element.
 * @param eased - The label's eased progress from `textFxFrame`. Clamped to 0 to 1.
 */
export function applyButtonFrame(button: ElementCSSInlineStyle, eased: number): void {
  button.style.setProperty(BUTTON_ALPHA_PROPERTY, cssNumber(clamp(eased)));
}
