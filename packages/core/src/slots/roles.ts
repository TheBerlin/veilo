// roles.ts: which role an element can play, and the guess when the layout names none.
// Layer 2. Reads only the element it is given.

import { GUESSED_ROLE_TAGS, type SlotRole } from "../schema/layout.ts";

/**
 * Tells whether an element tag is in one of the guessed-role tag lists.
 *
 * @param element - The element.
 * @param tags - Lowercase tag names.
 * @returns `true` when the element's tag is listed.
 */
function hasTag(element: Element, tags: readonly string[]): boolean {
  return tags.includes(element.tagName.toLowerCase());
}

/**
 * Tells whether an element can be the reveal's image.
 *
 * @param element - The element.
 * @returns `true` for `<img>` and `<canvas>`.
 */
export function canBeImage(element: Element): boolean {
  return hasTag(element, GUESSED_ROLE_TAGS.image);
}

/**
 * Guesses a slot's role from its element: images and canvases are `image`, buttons are
 * `button`, videos are `block` (they get a placeholder but no effect), and the rest is `text`.
 *
 * @param element - The element.
 * @returns The guessed role.
 */
export function guessRole(element: Element): SlotRole {
  if (hasTag(element, GUESSED_ROLE_TAGS.image)) return "image";
  if (hasTag(element, GUESSED_ROLE_TAGS.button)) return "button";
  if (hasTag(element, GUESSED_ROLE_TAGS.block)) return "block";
  return "text";
}
