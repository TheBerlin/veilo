// content-store.ts: what the preview shows, apart from the effect settings: the image area's
// ratio, the card layout and the edited card text; width joins in the Custom content task. Kept out of the
// settings object, which is what the packages read and the Settings JSON export writes.

import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";
import { DEFAULT_RATIO, toRatioId, type AspectRatioId } from "../stage/aspect-ratio.ts";
import {
  CARD_LAYOUTS,
  cleanText,
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
}

/** The store's state: the content plus the actions that change it. */
export interface ContentState {
  /** The current content. */
  content: Content;
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
  /** Drops every edit of one layout, back to its default text. */
  resetTexts: (layout: CardLayoutId) => void;
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
  return { ratio: DEFAULT_RATIO, layout: DEFAULT_LAYOUT, texts: {} };
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
  };
  return {
    ratio: toRatioId(value.ratio) ?? DEFAULT_RATIO,
    layout: toLayoutId(value.layout) ?? DEFAULT_LAYOUT,
    texts: parseTexts(value.texts),
  };
}

/**
 * Creates a content store. The app makes one; tests make a fresh one each.
 *
 * @param initial - Optional starting input, checked like `load`.
 * @returns The store.
 */
export function createContentStore(initial?: unknown): ContentStore {
  return createStore<ContentState>()((setState) => ({
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
    resetTexts: (layout) =>
      setState((state) => {
        if (!state.content.texts[layout]) return state;
        const texts = { ...state.content.texts };
        delete texts[layout];
        return { content: { ...state.content, texts } };
      }),
    load: (input) => setState({ content: parseContent(input) }),
  }));
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
