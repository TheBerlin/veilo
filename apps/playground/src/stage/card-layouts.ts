// card-layouts.ts: the playground's card layouts as one table: slots, bar widths, default text
// and default width. The card, the Content tab and the layout JSON export all read it.

import type { Layout } from "@veilo/core";

/** The id of a card layout. */
export type CardLayoutId = "product" | "list" | "profile" | "article" | "table";

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

/** A small image, a title with one line under it, and a price at the right. */
export const LIST_LAYOUT: CardLayout = {
  id: "list",
  name: "List row",
  width: 480,
  hasRatio: false,
  slots: {
    photo: { role: "image" },
    heading: { role: "text", width: 55 },
    line1: { role: "text", width: 90 },
    price: { role: "text" },
  },
  texts: [
    { slot: "heading", label: "Title", text: "MCHOSE L7 Pro" },
    { slot: "line1", label: "Description", text: "Lightweight 8K polling mouse" },
    { slot: "price", label: "Price", text: "$59.99" },
  ],
};

/** A round avatar with a name and handle, a short bio and a Follow button. */
export const PROFILE_LAYOUT: CardLayout = {
  id: "profile",
  name: "Profile header",
  width: 400,
  hasRatio: false,
  slots: {
    photo: { role: "image" },
    heading: { role: "text", width: 70 },
    line1: { role: "text", width: 50 },
    line2: { role: "text", width: 95 },
    buy: { role: "button" },
    label: { role: "text" },
  },
  texts: [
    { slot: "heading", label: "Name", text: "Mara Lindqvist" },
    { slot: "line1", label: "Handle", text: "@maralind" },
    { slot: "line2", label: "Bio", text: "Product designer. Builds calm interfaces." },
    { slot: "label", label: "Button label", text: "Follow" },
  ],
};

/** A large image, a tag, a headline, two lines of excerpt and a byline. */
export const ARTICLE_LAYOUT: CardLayout = {
  id: "article",
  name: "Article teaser",
  width: 360,
  hasRatio: true,
  slots: {
    photo: { role: "image" },
    tag: { role: "text", width: 30 },
    heading: { role: "text", width: 90 },
    line1: { role: "text", width: 96 },
    line2: { role: "text", width: 70 },
    meta: { role: "text", width: 50 },
  },
  texts: [
    { slot: "tag", label: "Tag", text: "Release notes" },
    { slot: "heading", label: "Headline", text: "Veilo 0.6 adds share links" },
    { slot: "line1", label: "Excerpt, line 1", text: "Send any effect as one short link, and" },
    { slot: "line2", label: "Excerpt, line 2", text: "open it on another device unchanged." },
    { slot: "meta", label: "Byline", text: "Mara L. Â· 4 min read" },
  ],
};

/** One wide row: a small image, a name with a code under it, a category, stock and a price. */
export const TABLE_LAYOUT: CardLayout = {
  id: "table",
  name: "Table row",
  width: 640,
  hasRatio: false,
  slots: {
    photo: { role: "image" },
    heading: { role: "text", width: 70 },
    line1: { role: "text", width: 45 },
    category: { role: "text", width: 70 },
    stock: { role: "text", width: 70 },
    price: { role: "text" },
  },
  texts: [
    { slot: "heading", label: "Name", text: "MCHOSE L7 Pro" },
    { slot: "line1", label: "Code", text: "SKU 8841" },
    { slot: "category", label: "Category", text: "Mice" },
    { slot: "stock", label: "Stock", text: "In stock" },
    { slot: "price", label: "Price", text: "$59.99" },
  ],
};

/** Every layout, by id. */
export const CARD_LAYOUTS: Record<CardLayoutId, CardLayout> = {
  product: PRODUCT_LAYOUT,
  list: LIST_LAYOUT,
  profile: PROFILE_LAYOUT,
  article: ARTICLE_LAYOUT,
  table: TABLE_LAYOUT,
};

/** The layout ids in the order the picker shows them. */
export const LAYOUT_IDS = Object.keys(CARD_LAYOUTS) as CardLayoutId[];

/** The layout the card starts with: the product card of spec 1.2 and the visual baselines. */
export const DEFAULT_LAYOUT: CardLayoutId = "product";

/**
 * Narrows any value to a layout id, for saved or shared input.
 *
 * @param value - An unchecked value.
 * @returns The id, or `undefined` when the value is not one.
 */
export function toLayoutId(value: unknown): CardLayoutId | undefined {
  return LAYOUT_IDS.find((id) => id === value);
}

/** The narrowest card width in CSS px the width slider allows. */
export const WIDTH_MIN = 200;
/** The widest card width in CSS px the width slider allows. */
export const WIDTH_MAX = 720;
/** The slider's step in CSS px. */
export const WIDTH_STEP = 10;

/**
 * Makes a width fit the slider: a whole number of steps inside the range.
 *
 * @param width - The width as read or dragged.
 * @returns The nearest allowed width.
 */
export function cleanWidth(width: number): number {
  const stepped = Math.round(width / WIDTH_STEP) * WIDTH_STEP;
  return Math.min(WIDTH_MAX, Math.max(WIDTH_MIN, stepped));
}

/** The longest text a part may hold, in UTF-16 units. Keeps share links short. */
export const TEXT_LIMIT = 120;

/**
 * Makes typed or saved text fit a part: line breaks and tabs become spaces (a part is one line of
 * a card) and the length is capped at {@link TEXT_LIMIT}.
 *
 * @param text - The text as typed or read.
 * @returns The cleaned text. It may be empty.
 */
export function cleanText(text: string): string {
  return text.replace(/[\r\n\t]+/g, " ").slice(0, TEXT_LIMIT);
}

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
