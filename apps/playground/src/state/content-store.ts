// content-store.ts: what the preview shows, apart from the effect settings: the image area's
// ratio, the card layout and the edited card text and width. Kept out of the settings object,
// which is what the packages read and the Settings JSON export writes.

import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";
import { DEFAULT_RATIO, toRatioId, type AspectRatioId } from "../stage/aspect-ratio.ts";
import {
  loadImageFile,
  loadImageUrl,
  NOT_AN_IMAGE,
  SAMPLE_IMAGES,
  type CardImage,
} from "../stage/image-source.ts";
import {
  CARD_LAYOUTS,
  cleanText,
  cleanWidth,
  DEFAULT_LAYOUT,
  LAYOUT_IDS,
  toLayoutId,
  type CardLayoutId,
} from "../stage/card-layouts.ts";

/** The preview content. Plain JSON, ready to save or share. */
export interface Content {
  /** The image area's ratio; only layouts with a large image use it. */
  ratio: AspectRatioId;
  /** The card layout. */
  layout: CardLayoutId;
  /**
   * The user's text, per layout and slot. Only parts that differ from the layout's default are
   * stored, so each layout keeps its own edits and an untouched layout has no entry.
   */
  texts: Partial<Record<CardLayoutId, Record<string, string>>>;
  /**
   * The user's card width in CSS px, per layout. Only widths that differ from the layout's
   * default are stored, so an untouched layout uses its own default width.
   */
  widths: Partial<Record<CardLayoutId, number>>;
}

/**
 * The photo on the card. It is the user's own file or one of the samples, so it is never saved or
 * shared: only the content above is.
 */
export interface PhotoSource {
  /** The decoded picture, or `null` for the drawn placeholder. */
  image: CardImage | null;
  /** The id of the chosen sample, or `null` for the placeholder or the user's own file. */
  sample: string | null;
  /** The message for a file that was not an image, or `null`. */
  error: string | null;
  /** Counts the pictures that arrived, so a listener knows to rebuild the card. */
  loads: number;
}

/** The store's state: the content, the photo, and the actions that change them. */
export interface ContentState {
  /** The current content. */
  content: Content;
  /** The photo on the card. */
  photo: PhotoSource;
  /** Shows one of the samples; an unknown id does nothing. */
  pickSample: (id: string) => void;
  /** Shows the user's own image file; a file that is not an image sets `photo.error`. */
  pickFile: (file: File) => void;
  /** Goes back to the drawn placeholder. */
  clearPhoto: () => void;
  /** Changes the image area's ratio. */
  setRatio: (ratio: AspectRatioId) => void;
  /** Changes the card layout. */
  setLayout: (layout: CardLayoutId) => void;
  /**
   * Sets one text part of a layout. Text equal to the default removes the edit.
   *
   * @param layout - The layout the part belongs to.
   * @param slot - The part's slot name; unknown slots are ignored.
   * @param text - The new text, cleaned to fit the part.
   */
  setText: (layout: CardLayoutId, slot: string, text: string) => void;
  /**
   * Sets a layout's card width. A width equal to the default removes the edit.
   *
   * @param layout - The layout.
   * @param width - The width in CSS px, snapped to the slider's steps and range.
   */
  setWidth: (layout: CardLayoutId, width: number) => void;
  /** Drops every edit of one layout, text and width, back to its defaults. */
  resetLayout: (layout: CardLayoutId) => void;
  /**
   * Replaces the content with checked input over the defaults, as a share link or the last
   * session does. Unknown or invalid parts fall back to their defaults.
   */
  load: (input: unknown) => void;
}

/** A content store instance. */
export type ContentStore = StoreApi<ContentState>;

/**
 * The default content.
 *
 * @returns A fresh object.
 */
export function defaultContent(): Content {
  return { ratio: DEFAULT_RATIO, layout: DEFAULT_LAYOUT, texts: {}, widths: {} };
}

/**
 * Reads saved text: known layouts and slots only, strings only, cleaned, and only what differs
 * from the default.
 *
 * @param input - An unchecked value.
 * @returns The checked texts.
 */
function parseTexts(input: unknown): Content["texts"] {
  const texts: Content["texts"] = {};
  if (typeof input !== "object" || input === null) return texts;
  for (const id of LAYOUT_IDS) {
    const saved = (input as Record<string, unknown>)[id];
    if (typeof saved !== "object" || saved === null) continue;
    const kept: Record<string, string> = {};
    for (const part of CARD_LAYOUTS[id].texts) {
      const value = (saved as Record<string, unknown>)[part.slot];
      if (typeof value !== "string") continue;
      const text = cleanText(value);
      if (text !== part.text) kept[part.slot] = text;
    }
    if (Object.keys(kept).length > 0) texts[id] = kept;
  }
  return texts;
}

/**
 * Reads saved widths: known layouts only, finite numbers only, snapped, and only what differs
 * from the default.
 *
 * @param input - An unchecked value.
 * @returns The checked widths.
 */
function parseWidths(input: unknown): Content["widths"] {
  const widths: Content["widths"] = {};
  if (typeof input !== "object" || input === null) return widths;
  for (const id of LAYOUT_IDS) {
    const value = (input as Record<string, unknown>)[id];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    const width = cleanWidth(value);
    if (width !== CARD_LAYOUTS[id].width) widths[id] = width;
  }
  return widths;
}

/**
 * Reads content from unchecked input, part by part.
 *
 * @param input - Saved or shared content, unchecked.
 * @returns Full content: valid parts from the input, defaults for the rest.
 */
export function parseContent(input: unknown): Content {
  const value = (typeof input === "object" && input !== null ? input : {}) as {
    ratio?: unknown;
    layout?: unknown;
    texts?: unknown;
    widths?: unknown;
  };
  return {
    ratio: toRatioId(value.ratio) ?? DEFAULT_RATIO,
    layout: toLayoutId(value.layout) ?? DEFAULT_LAYOUT,
    texts: parseTexts(value.texts),
    widths: parseWidths(value.widths),
  };
}

/**
 * Creates a content store. The app makes one; tests make a fresh one each.
 *
 * @param initial - Optional starting input, checked like `load`.
 * @returns The store.
 */
export function createContentStore(initial?: unknown): ContentStore {
  return createStore<ContentState>()((setState) => {
    // Only the latest request may win when loads overlap. Per store, so nothing is shared.
    let request = 0;
    const show = (load: Promise<CardImage | null>, sample: string | null) => {
      const id = ++request;
      load.then(
        (image) => {
          if (id !== request) return;
          setState((state) => ({
            photo: { image, sample, error: null, loads: state.photo.loads + 1 },
          }));
        },
        () => {
          if (id === request) {
            setState((state) => ({ photo: { ...state.photo, error: NOT_AN_IMAGE } }));
          }
        },
      );
    };
    return {
      photo: { image: null, sample: null, error: null, loads: 0 },
      pickSample: (id) => {
        const sample = SAMPLE_IMAGES.find((item) => item.id === id);
        if (sample) show(loadImageUrl(sample.url), id);
      },
      pickFile: (file) => show(loadImageFile(file), null),
      clearPhoto: () => show(Promise.resolve(null), null),
      content: initial === undefined ? defaultContent() : parseContent(initial),
      setRatio: (ratio) =>
        setState((state) =>
          // The same state object when nothing changes, so subscribers stay asleep.
          state.content.ratio === ratio ? state : { content: { ...state.content, ratio } },
        ),
      setLayout: (layout) =>
        setState((state) =>
          state.content.layout === layout ? state : { content: { ...state.content, layout } },
        ),
      setText: (layout, slot, text) =>
        setState((state) => {
          const part = CARD_LAYOUTS[layout].texts.find((item) => item.slot === slot);
          if (!part) return state;
          const cleaned = cleanText(text);
          const edits = { ...state.content.texts[layout] };
          if (cleaned === part.text) delete edits[slot];
          else edits[slot] = cleaned;
          const before = state.content.texts[layout]?.[slot];
          // The same state object when nothing changes, so subscribers stay asleep.
          if (before === edits[slot]) return state;
          const texts = { ...state.content.texts };
          if (Object.keys(edits).length > 0) texts[layout] = edits;
          else delete texts[layout];
          return { content: { ...state.content, texts } };
        }),
      setWidth: (layout, width) =>
        setState((state) => {
          const cleaned = cleanWidth(width);
          const widths = { ...state.content.widths };
          if (cleaned === CARD_LAYOUTS[layout].width) delete widths[layout];
          else widths[layout] = cleaned;
          // The same state object when nothing changes, so subscribers stay asleep.
          if (widths[layout] === state.content.widths[layout]) return state;
          return { content: { ...state.content, widths } };
        }),
      resetLayout: (layout) =>
        setState((state) => {
          if (!state.content.texts[layout] && state.content.widths[layout] === undefined) {
            return state;
          }
          const texts = { ...state.content.texts };
          const widths = { ...state.content.widths };
          delete texts[layout];
          delete widths[layout];
          return { content: { ...state.content, texts, widths } };
        }),
      load: (input) => setState({ content: parseContent(input) }),
    };
  });
}

/**
 * Reads one part of the content and re-renders only when it changes.
 *
 * @param store - The content store.
 * @param key - The part to read.
 * @returns Its current value.
 */
export function useContent<K extends keyof Content>(store: ContentStore, key: K): Content[K] {
  return useStore(store, (state) => state.content[key]);
}
