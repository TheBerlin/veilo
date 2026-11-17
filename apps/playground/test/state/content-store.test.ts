// Tests for src/state/content-store.ts, in Node.

import { describe, expect, it, vi } from "vitest";
import { createContentStore, defaultContent, parseContent } from "../../src/state/content-store.ts";

describe("parseContent", () => {
  it("keeps valid parts and defaults the rest", () => {
    expect(parseContent({ ratio: "16:9" })).toEqual({ ratio: "16:9", layout: "product" });
    for (const input of [undefined, null, "x", [], {}, { ratio: "5:4" }, { ratio: 2 }]) {
      expect(parseContent(input), JSON.stringify(input)).toEqual(defaultContent());
    }
  });
});

describe("createContentStore", () => {
  it("starts square, or from checked input", () => {
    expect(createContentStore().getState().content).toEqual({ ratio: "1:1", layout: "product" });
    expect(createContentStore({ ratio: "3:4" }).getState().content).toEqual({
      ratio: "3:4",
      layout: "product",
    });
    expect(createContentStore({ ratio: "nope" }).getState().content).toEqual({
      ratio: "1:1",
      layout: "product",
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
    expect(store.getState().content).toEqual({ ratio: "16:9", layout: "article" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("loads input over the defaults", () => {
    const store = createContentStore({ ratio: "16:9" });
    store.getState().load(undefined);
    expect(store.getState().content).toEqual(defaultContent());
    store.getState().load({ ratio: "2:3", unknown: true });
    expect(store.getState().content).toEqual({ ratio: "2:3", layout: "product" });
  });
});
