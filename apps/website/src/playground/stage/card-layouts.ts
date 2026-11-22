// card-layouts.ts: the playground's card layouts as one table: slots, default text and default
// width. The card, the Content tab and the layout JSON export all read it. The three layouts are
// the home page's demo cards, so what people tune here is what they saw there.

import type { Layout } from "@veilo-ui/core";
import {
  INBOX_LAYOUT,
  MESSAGES,
  MUSIC_LAYOUT,
  MUSIC_TEXTS,
  VIDEO_LAYOUT,
  VIDEO_TEXTS,
} from "../../home/demo-data.ts";
import type { SceneId } from "../../home/demo-scenes.ts";

/** The id of a card layout. */
export type CardLayoutId = "inbox" | "video" | "music";

/** One editable text part of a layout. */
export interface CardTextPart {
  /** The slot name, as in `data-veilo-slot`. */
  slot: string;
  /** The field label in the Content tab. */
  label: string;
  /** The text shown until the user edits it. */
  text: string;
}

/** The picture of a layout: which slot it is, its shape and the drawing shown until a photo is chosen. */
export interface CardPicture {
  /** The slot name of the picture's canvas. */
  slot: string;
  /** Width divided by height; fixed by the card's design. */
  ratio: number;
  /** The home page's drawn scene shown while the user has chosen no photo. */
  scene: SceneId;
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
  /** The picture, or `undefined` for a layout without one (the inbox). */
  picture?: CardPicture;
  /** The slot table passed to core: roles and skeleton bar widths. */
  slots: Layout["slots"];
  /** The text parts in page order; every editable text slot appears once. */
  texts: readonly CardTextPart[];
}

/** A mail inbox: filter chips and four messages. All text, avatars and icons; no picture. */
export const INBOX_CARD_LAYOUT: CardLayout = {
  id: "inbox",
  name: "Inbox",
  width: 480,
  hasRatio: false,
  slots: INBOX_LAYOUT.slots,
  texts: MESSAGES.flatMap((message, index) => [
    { slot: `from${index}`, label: `Sender ${index + 1}`, text: message.from },
    { slot: `subject${index}`, label: `Subject ${index + 1}`, text: message.subject },
  ]),
};

/** A video tile: a wide thumbnail, an avatar, a two-line title and the channel's details. */
export const VIDEO_CARD_LAYOUT: CardLayout = {
  id: "video",
  name: "Video tile",
  width: 320,
  hasRatio: false,
  picture: { slot: "thumb", ratio: 16 / 9, scene: "street" },
  slots: VIDEO_LAYOUT.slots,
  texts: [
    { slot: "title", label: "Title", text: VIDEO_TEXTS.title },
    { slot: "channel", label: "Channel", text: VIDEO_TEXTS.channel },
    { slot: "stats", label: "Views and age", text: VIDEO_TEXTS.stats },
    { slot: "duration", label: "Duration", text: VIDEO_TEXTS.duration },
  ],
};

/** A wide music player: a square cover, the track, a progress bar and the controls. */
export const MUSIC_CARD_LAYOUT: CardLayout = {
  id: "music",
  name: "Music player",
  width: 480,
  hasRatio: false,
  picture: { slot: "cover", ratio: 1, scene: "album" },
  slots: MUSIC_LAYOUT.slots,
  texts: [
    { slot: "track", label: "Track", text: MUSIC_TEXTS.track },
    { slot: "artist", label: "Artist", text: MUSIC_TEXTS.artist },
    { slot: "time", label: "Time", text: MUSIC_TEXTS.time },
  ],
};

/** Every layout, by id. */
export const CARD_LAYOUTS: Record<CardLayoutId, CardLayout> = {
  music: MUSIC_CARD_LAYOUT,
  video: VIDEO_CARD_LAYOUT,
  inbox: INBOX_CARD_LAYOUT,
};

/** The layout ids in the order the picker shows them. */
export const LAYOUT_IDS = Object.keys(CARD_LAYOUTS) as CardLayoutId[];

/** The layout the card starts with, and the one the visual baselines show. */
export const DEFAULT_LAYOUT: CardLayoutId = "music";

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
