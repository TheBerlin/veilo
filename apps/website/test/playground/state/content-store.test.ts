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
      layout: "product",
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
      layout: "product",
      texts: {},
      widths: {},
    });
    expect(createContentStore({ ratio: "3:4" }).getState().content).toEqual({
      ratio: "3:4",
      layout: "product",
      texts: {},
      widths: {},
    });
    expect(createContentStore({ ratio: "nope" }).getState().content).toEqual({
      ratio: "1:1",
      layout: "product",
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
    expect(parseContent({ layout: "table" }).layout).toBe("table");
    for (const layout of ["grid", 4, null, undefined]) {
      expect(parseContent({ layout }).layout, String(layout)).toBe("product");
    }
  });

  it("changes the layout, and wakes nobody when it stays the same", () => {
    const store = createContentStore({ ratio: "16:9" });
    const listener = vi.fn();
    store.subscribe(listener);
    store.getState().setLayout("product");
    expect(listener).not.toHaveBeenCalled();
    store.getState().setLayout("article");
    // The ratio is kept: it comes back when the user returns to a layout that uses it.
    expect(store.getState().content).toEqual({
      ratio: "16:9",
      layout: "article",
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
      layout: "product",
      texts: {},
      widths: {},
    });
  });
});

describe("text edits", () => {
  it("stores only parts that differ from the default, per layout", () => {
    const store = createContentStore();
    const { setText } = store.getState();
    setText("product", "heading", "Hello");
    setText("list", "heading", "Other");
    setText("product", "label", "Buy now");
    expect(store.getState().content.texts).toEqual({
      product: { heading: "Hello" },
      list: { heading: "Other" },
    });
    // Back to the default removes the edit, and an empty layout entry goes with it.
    setText("list", "heading", "MCHOSE L7 Pro");
    expect(store.getState().content.texts).toEqual({ product: { heading: "Hello" } });
  });

  it("cleans text: one line, at most 120 characters, empty allowed", () => {
    const store = createContentStore();
    store.getState().setText("product", "heading", `a\nb\t${"x".repeat(200)}`);
    const heading = store.getState().content.texts.product!.heading!;
    expect(heading.startsWith("a b ")).toBe(true);
    expect(heading).toHaveLength(120);
    store.getState().setText("product", "heading", "");
    expect(store.getState().content.texts.product).toEqual({ heading: "" });
  });

  it("ignores unknown slots, and wakes nobody when nothing changes", () => {
    const store = createContentStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.getState().setText("product", "nope", "x");
    store.getState().setText("product", "heading", "MCHOSE L7 Pro");
    store.getState().resetLayout("product");
    expect(listener).not.toHaveBeenCalled();
    store.getState().setText("product", "heading", "A");
    store.getState().setText("product", "heading", "A");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("resets one layout and keeps the others", () => {
    const store = createContentStore();
    store.getState().setText("product", "heading", "A");
    store.getState().setText("table", "stock", "Sold out");
    store.getState().resetLayout("product");
    expect(store.getState().content.texts).toEqual({ table: { stock: "Sold out" } });
  });

  it("reads saved text part by part and drops what is wrong", () => {
    const content = parseContent({
      texts: {
        product: { heading: "Kept", line1: 5, nope: "x", label: "Buy now" },
        grid: { heading: "unknown layout" },
        list: "not an object",
      },
    });
    expect(content.texts).toEqual({ product: { heading: "Kept" } });
    for (const texts of [undefined, null, "x", [], 3]) {
      expect(parseContent({ texts }).texts, JSON.stringify(texts)).toEqual({});
    }
  });
});

describe("card width", () => {
  it("snaps to 10 px steps inside 200 to 720, per layout, and drops the default", () => {
    const store = createContentStore();
    const { setWidth } = store.getState();
    setWidth("product", 333);
    setWidth("table", 5000);
    setWidth("list", 1);
    expect(store.getState().content.widths).toEqual({ product: 330, table: 720, list: 200 });
    // The product card's default is 320, so choosing it again removes the edit.
    setWidth("product", 320);
    expect(store.getState().content.widths).toEqual({ table: 720, list: 200 });
  });

  it("wakes nobody when the width stays the same", () => {
    const store = createContentStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.getState().setWidth("product", 320);
    store.getState().setWidth("product", 400);
    store.getState().setWidth("product", 404);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("reads saved widths part by part and drops what is wrong", () => {
    const content = parseContent({
      widths: {
        product: 400,
        list: "wide",
        table: Number.NaN,
        profile: 400,
        grid: 300,
        article: 90,
      },
    });
    // profile's default is 400, so it is no edit; article is clamped up to the minimum.
    expect(content.widths).toEqual({ product: 400, article: 200 });
    for (const widths of [undefined, null, "x", [], 3]) {
      expect(parseContent({ widths }).widths, JSON.stringify(widths)).toEqual({});
    }
  });

  it("Reset clears one layout's text and width together", () => {
    const store = createContentStore();
    store.getState().setWidth("product", 400);
    store.getState().setText("product", "heading", "A");
    store.getState().setWidth("table", 700);
    store.getState().resetLayout("product");
    expect(store.getState().content.texts).toEqual({});
    expect(store.getState().content.widths).toEqual({ table: 700 });
  });
});
