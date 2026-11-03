/**
 * discover.ts: finds the `data-veilo-slot` elements in a container and gives each its role.
 * Layer 2. Reads the container it is given; changes nothing.
 */

import type { Layout, SlotHint, SlotRole } from "../schema/layout.ts";
import { canBeImage, guessRole } from "./roles.ts";

/** The attribute that names a slot in the markup. */
export const SLOT_ATTRIBUTE = "data-veilo-slot";

/** One element found in the markup, with its resolved role and hints. */
export interface FoundSlot {
  /** The slot name from the attribute. */
  name: string;
  element: HTMLElement;
  role: SlotRole;
  /** The layout's hints for this slot; empty when it has none. */
  hint: SlotHint;
}

/** The result of {@link findSlots}. */
export interface SlotDiscovery {
  /** Every slot element in page order. */
  slots: FoundSlot[];
  /** Mismatches between the layout and the markup, for development warnings. */
  problems: string[];
}

/**
 * Finds the slots inside a container.
 *
 * Elements come in page order, which is also the order of the text timeline and the wave delay.
 * A slot's role comes from the layout, or is guessed from the element when the layout has no
 * entry. Problems are reported, never thrown: a layout slot missing from the markup is skipped,
 * an element the layout does not name gets a guessed role, an `image` role on an element that
 * is not an image becomes `block`, and only the first image and the first button are used as
 * such (later ones become `block`).
 *
 * @param container - The element to search. The container itself is not a slot.
 * @param layout - The layout, from `parseLayout`.
 * @returns The slots and the problems found.
 */
export function findSlots(container: Element, layout: Layout): SlotDiscovery {
  const problems: string[] = [];
  const slots: FoundSlot[] = [];
  const named = Object.keys(layout.slots);
  const hasMap = named.length > 0;
  const seen = new Set<string>();
  let hasImage = false;
  let hasButton = false;

  for (const element of container.querySelectorAll<HTMLElement>(`[${SLOT_ATTRIBUTE}]`)) {
    const name = (element.getAttribute(SLOT_ATTRIBUTE) ?? "").trim();
    if (!name) {
      problems.push(`an element has an empty ${SLOT_ATTRIBUTE} attribute and is skipped.`);
      continue;
    }
    seen.add(name);
    const hint = Object.hasOwn(layout.slots, name) ? (layout.slots[name] as SlotHint) : {};
    if (hasMap && !Object.hasOwn(layout.slots, name)) {
      problems.push(`slot "${name}" is not in the layout, so its role is guessed.`);
    }

    let role = hint.role ?? guessRole(element);
    if (role === "image" && !canBeImage(element)) {
      problems.push(
        `slot "${name}" has the image role but is not an <img> or <canvas>; it is a block.`,
      );
      role = "block";
    }
    if (role === "image" && hasImage) {
      problems.push(
        `slot "${name}" is a second image; only the first is revealed, so it is a block.`,
      );
      role = "block";
    }
    if (role === "button" && hasButton) {
      problems.push(
        `slot "${name}" is a second button; only the first fades in, so it is a block.`,
      );
      role = "block";
    }
    hasImage ||= role === "image";
    hasButton ||= role === "button";
    slots.push({ name, element, role, hint });
  }

  for (const name of named) {
    if (!seen.has(name))
      problems.push(`slot "${name}" is in the layout but not in the markup; it is skipped.`);
  }
  return { slots, problems };
}
