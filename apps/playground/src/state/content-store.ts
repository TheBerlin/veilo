// content-store.ts: what the preview shows, apart from the effect settings: for now the image
// area's ratio; card text, layout and width join in the Custom content task. Kept out of the
// settings object, which is what the packages read and the Settings JSON export writes.

import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";
import { DEFAULT_RATIO, toRatioId, type AspectRatioId } from "../stage/aspect-ratio.ts";

/** The preview content. Plain JSON, ready to save or share. */
export interface Content {
  /** The image area's ratio. */
  ratio: AspectRatioId;
}

/** The store's state: the content plus the actions that change it. */
export interface ContentState {
  /** The current content. */
  content: Content;
  /** Changes the image area's ratio. */
  setRatio: (ratio: AspectRatioId) => void;
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
  return { ratio: DEFAULT_RATIO };
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
  };
  return { ratio: toRatioId(value.ratio) ?? DEFAULT_RATIO };
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
