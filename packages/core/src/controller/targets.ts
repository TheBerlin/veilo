/**
 * targets.ts: turns either explicit targets or a container with slot markup into the elements a
 * reveal or skeleton animates.
 * Layer 3. Reads the markup; reports slot problems in development builds.
 */

import { parseLayout } from "../schema/layout.ts";
import type { Settings } from "../schema/types.ts";
import { warnSlotProblems } from "../slots/dev-warnings.ts";
import { findSlots } from "../slots/discover.ts";

/** The elements a reveal animates. A container with `data-veilo-slot` markup builds the same. */
export interface RevealTargets {
  /** The photo. Grid effects draw over it; the other image effects style it. */
  image?: HTMLImageElement | HTMLCanvasElement;
  /** Text elements in timeline order, for example heading, description, price, button label. */
  text?: readonly HTMLElement[];
  /** The button whose background (`--veilo-bg-a`) fades in with its label. */
  button?: HTMLElement;
}

/** What {@link resolveTargets} found. */
export interface ResolvedTargets {
  settings: Settings;
  targets: RevealTargets;
  /** Every element that shows the skeleton, in page order. */
  placeholders: HTMLElement[];
  /** The container, when one was given; it is the default busy region. */
  container?: Element;
}

/**
 * Tells a container element apart from a targets object.
 *
 * @param value - Either.
 * @returns `true` for an element.
 */
export function isContainer(value: RevealTargets | Element): value is Element {
  return typeof (value as Element).querySelectorAll === "function";
}

/**
 * Resolves the elements and settings for a reveal or skeleton.
 *
 * With explicit targets, the placeholders are the image, the texts and the button. With a
 * container, the slots are found from `data-veilo-slot` markup: `image`, `text` and `button`
 * slots become the targets, and every slot, `block` ones included, shows the skeleton.
 *
 * @param first - Explicit targets, or the container to search.
 * @param input - A layout or plain settings, as JSON.
 * @param warnings - Whether to print slot mismatches to the console.
 * @returns The settings, targets and placeholders.
 */
export function resolveTargets(
  first: RevealTargets | Element,
  input: unknown,
  warnings: boolean,
): ResolvedTargets {
  const layout = parseLayout(input);
  if (!isContainer(first)) {
    const { image, text = [], button } = first;
    const listed = [image, ...text, button].filter((e): e is HTMLElement => e !== undefined);
    return { settings: layout.settings, targets: first, placeholders: [...new Set(listed)] };
  }

  const { slots, problems } = findSlots(first, layout);
  warnSlotProblems(problems, warnings);
  const of = (role: string) => slots.filter((slot) => slot.role === role).map((s) => s.element);
  return {
    settings: layout.settings,
    targets: {
      image: of("image")[0] as HTMLImageElement | HTMLCanvasElement | undefined,
      text: of("text"),
      button: of("button")[0],
    },
    placeholders: slots.map((slot) => slot.element),
    container: first,
  };
}
