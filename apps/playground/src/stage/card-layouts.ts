// card-layouts.ts: the playground's card layouts as one table: slots, bar widths, default text
// and default width. The card, the Content tab and the layout JSON export all read it.

import type { Layout } from "@veilo/core";

/** The id of a card layout. */
export type CardLayoutId = "product";

/** One editable text part of a layout. */
export interface CardTextPart {
  /** The slot name, as in `data-veilo-slot`. */
  slot: string;
  /** The field label in the Content tab. */
  label: string;
  /** The text shown until the user edits it. */
  text: string;
}

/** A card layout: what it is called, how wide it starts, which slots it has and its text. */
export interface CardLayout {
  /** The layout's id. */
  id: CardLayoutId;
  /** The name shown in the layout picker. */
  name: string;
  /** The card width in CSS px until the user sets another one. */
  width: number;
  /** Whether the image area has a large photo whose ratio the user may choose. */
  hasRatio: boolean;
  /** The slot table passed to core: roles and skeleton bar widths. */
  slots: Layout["slots"];
  /** The text parts in page order; every `text` slot of `slots` appears once. */
  texts: readonly CardTextPart[];
}

/**
 * The product card (spec 1.2). The image and the button are full width. "Buy now" is a span named
 * as the button role, because the whole card is already a button and a button inside a button is
 * invalid. The prices are sized to 28% and 20% of their row in CSS, so their bars are full width.
 */
export const PRODUCT_LAYOUT: CardLayout = {
  id: "product",
  name: "Product card",
  width: 320,
  hasRatio: true,
  slots: {
    photo: { role: "image" },
    heading: { role: "text", width: 58 },
    line1: { role: "text", width: 96 },
    line2: { role: "text", width: 70 },
    price: { role: "text" },
    oldPrice: { role: "text" },
    buy: { role: "button" },
    label: { role: "text" },
  },
  texts: [
    { slot: "heading", label: "Heading", text: "MCHOSE L7 Pro" },
    { slot: "line1", label: "Description, line 1", text: "Lightweight 8K polling mouse with" },
    { slot: "line2", label: "Description, line 2", text: "tri-mode wireless and a 60 g shell." },
    { slot: "price", label: "Price", text: "$59.99" },
    { slot: "oldPrice", label: "Old price", text: "$79.99" },
    { slot: "label", label: "Button label", text: "Buy now" },
  ],
};

/** Every layout, by id. */
export const CARD_LAYOUTS: Record<CardLayoutId, CardLayout> = { product: PRODUCT_LAYOUT };

/**
 * Finds a text part's default text.
 *
 * @param layout - The layout to look in.
 * @param slot - The slot name.
 * @returns The default text, or an empty string when the layout has no such part.
 */
export function defaultText(layout: CardLayout, slot: string): string {
  return layout.texts.find((part) => part.slot === slot)?.text ?? "";
}
