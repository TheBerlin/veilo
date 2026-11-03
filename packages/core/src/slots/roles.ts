/**
 * roles.ts: which role an element can play, and the guess when the layout names none.
 * Layer 2. Reads only the element it is given.
 */

import type { SlotRole } from "../schema/layout.ts";

// Elements the grid and image effects can draw from.
const IMAGE_TAGS = ["IMG", "CANVAS"];

/**
 * Tells whether an element can be the reveal's image.
 *
 * @param element - The element.
 * @returns `true` for `<img>` and `<canvas>`.
 */
export function canBeImage(element: Element): boolean {
  return IMAGE_TAGS.includes(element.tagName.toUpperCase());
}

/**
 * Guesses a slot's role from its element: images and canvases are `image`, buttons are
 * `button`, videos are `block` (they get a placeholder but no effect), and the rest is `text`.
 *
 * @param element - The element.
 * @returns The guessed role.
 */
export function guessRole(element: Element): SlotRole {
  const tag = element.tagName.toUpperCase();
  if (IMAGE_TAGS.includes(tag)) return "image";
  if (tag === "BUTTON") return "button";
  if (tag === "VIDEO") return "block";
  return "text";
}
