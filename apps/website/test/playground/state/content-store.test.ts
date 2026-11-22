// Tests for src/state/content-store.ts, in Node.

import { describe, expect, it, vi } from "vitest";
import {
  createContentStore,
  defaultContent,
  parseContent,
} from "../../../src/playground/state/content-store.ts";

describe("parseContent", () => {
  it("keeps valid parts and defaults the rest", () => {
    expect(parseContent({ ratio: "16:9" })).toEqual({
      ratio: "16:9",
      layout: "music",
      texts: {},
      widths: {},
    });
    for (const input of [undefined, null, "x", [], {}, { ratio: "5:4" }, { ratio: 2 }]) {
      expect(parseContent(input), JSON.stringify(input)).toEqual(defaultContent());
    }
  });
});

describe("createContentStore", () => {
  it("starts square, or from checked input", () => {
    expect(createContentStore().getState().content).toEqual({
      ratio: "1:1",
      layout: "music",
      texts: {},
      widths: {},
    });
    expect(createContentStore({ ratio: "3:4" }).getState().content).toEqual({
      ratio: "3:4",
      layout: "music",
      texts: {},
      widths: {},
    });
    expect(createContentStore({ ratio: "nope" }).getState().content).toEqual({
      ratio: "1:1",
      layout: "music",
      texts: {},
      widths: {},
    });
  });

  it("changes the ratio, and wakes nobody when it stays the same", () => {
    const store = createContentStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.getState().setRatio("1:1");
    expect(listener).not.toHaveBeenCalled();
    store.getState().setRatio("image");
    expect(store.getState().content.ratio).toBe("image");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keeps a valid layout and defaults an unknown one", () => {
    expect(parseContent({ layout: "inbox" }).layout).toBe("inbox");
    for (const layout of ["grid", 4, null, undefined]) {
      expect(parseContent({ layout }).layout, String(layout)).toBe("music");
    }
  });

  it("changes the layout, and wakes nobody when it stays the same", () => {
    const store = createContentStore({ ratio: "16:9" });
    const listener = vi.fn();
    store.subscribe(listener);
    store.getState().setLayout("music");
    expect(listener).not.toHaveBeenCalled();
    store.getState().setLayout("video");
    // The ratio is kept: it comes back when the user returns to a layout that uses it.
    expect(store.getState().content).toEqual({
      ratio: "16:9",
      layout: "video",
      texts: {},
      widths: {},
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("loads input over the defaults", () => {
    const store = createContentStore({ ratio: "16:9" });
    store.getState().load(undefined);
    expect(store.getState().content).toEqual(defaultContent());
    store.getState().load({ ratio: "2:3", unknown: true });
    expect(store.getState().content).toEqual({
      ratio: "2:3",
      layout: "music",
      texts: {},
      widths: {},
    });
  });
});

describe("text edits", () => {
  it("stores only parts that differ from the default, per layout", () => {
    const store = createContentStore();
    const { setText } = store.getState();
    setText("music", "track", "Hello");
    setText("video", "title", "Other");
    setText("music", "time", "00:42 / 03:18");
    expect(store.getState().content.texts).toEqual({
      music: { track: "Hello" },
      video: { title: "Other" },
    });
    // Back to the default removes the edit, and an empty layout entry goes with it.
    setText("video", "title", "Night walk through the old town in 4K, no talking");
    expect(store.getState().content.texts).toEqual({ music: { track: "Hello" } });
  });

  it("cleans text: one line, at most 120 characters, empty allowed", () => {
    const store = createContentStore();
    store.getState().setText("music", "track", `a\nb\t${"x".repeat(200)}`);
    const track = store.getState().content.texts.music!.track!;
    expect(track.startsWith("a b ")).toBe(true);
    expect(track).toHaveLength(120);
    store.getState().setText("music", "track", "");
    expect(store.getState().content.texts.music).toEqual({ track: "" });
  });

  it("ignores unknown slots, and wakes nobody when nothing changes", () => {
    const store = createContentStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.getState().setText("music", "nope", "x");
    store.getState().setText("music", "track", "Glass Horizon");
    store.getState().resetLayout("music");
    expect(listener).not.toHaveBeenCalled();
    store.getState().setText("music", "track", "A");
    store.getState().setText("music", "track", "A");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("resets one layout and keeps the others", () => {
    const store = createContentStore();
    store.getState().setText("music", "track", "A");
    store.getState().setText("inbox", "from1", "Someone");
    store.getState().resetLayout("music");
    expect(store.getState().content.texts).toEqual({ inbox: { from1: "Someone" } });
  });

  it("reads saved text part by part and drops what is wrong", () => {
    const content = parseContent({
      texts: {
        music: { track: "Kept", artist: 5, nope: "x", time: "00:42 / 03:18" },
        grid: { track: "unknown layout" },
        video: "not an object",
      },
    });
    expect(content.texts).toEqual({ music: { track: "Kept" } });
    for (const texts of [undefined, null, "x", [], 3]) {
      expect(parseContent({ texts }).texts, JSON.stringify(texts)).toEqual({});
    }
  });
});

describe("card width", () => {
  it("snaps to 10 px steps inside 200 to 720, per layout, and drops the default", () => {
    const store = createContentStore();
    const { setWidth } = store.getState();
    setWidth("music", 533);
    setWidth("inbox", 5000);
    setWidth("video", 1);
    expect(store.getState().content.widths).toEqual({ music: 530, inbox: 720, video: 200 });
    // The music player's default is 480, so choosing it again removes the edit.
    setWidth("music", 480);
    expect(store.getState().content.widths).toEqual({ inbox: 720, video: 200 });
  });

  it("wakes nobody when the width stays the same", () => {
    const store = createContentStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.getState().setWidth("music", 480);
    store.getState().setWidth("music", 400);
    store.getState().setWidth("music", 404);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("reads saved widths part by part and drops what is wrong", () => {
    const content = parseContent({
      widths: {
        music: 400,
        video: "wide",
        inbox: Number.NaN,
        grid: 300,
        article: 90,
      },
    });
    // video and inbox hold no number, and grid and article are not layouts.
    expect(content.widths).toEqual({ music: 400 });
    expect(parseContent({ widths: { video: 320 } }).widths).toEqual({});
    expect(parseContent({ widths: { video: 90 } }).widths).toEqual({ video: 200 });
    for (const widths of [undefined, null, "x", [], 3]) {
      expect(parseContent({ widths }).widths, JSON.stringify(widths)).toEqual({});
    }
  });

  it("Reset clears one layout's text and width together", () => {
    const store = createContentStore();
    store.getState().setWidth("music", 400);
    store.getState().setText("music", "track", "A");
    store.getState().setWidth("inbox", 700);
    store.getState().resetLayout("music");
    expect(store.getState().content.texts).toEqual({});
    expect(store.getState().content.widths).toEqual({ inbox: 700 });
  });
});
