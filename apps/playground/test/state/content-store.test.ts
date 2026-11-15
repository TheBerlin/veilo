// Tests for src/state/content-store.ts, in Node.

import { describe, expect, it, vi } from "vitest";
import { createContentStore, defaultContent, parseContent } from "../../src/state/content-store.ts";

describe("parseContent", () => {
  it("keeps valid parts and defaults the rest", () => {
    expect(parseContent({ ratio: "16:9" })).toEqual({ ratio: "16:9" });
    for (const input of [undefined, null, "x", [], {}, { ratio: "5:4" }, { ratio: 2 }]) {
      expect(parseContent(input), JSON.stringify(input)).toEqual(defaultContent());
    }
  });
});

describe("createContentStore", () => {
  it("starts square, or from checked input", () => {
    expect(createContentStore().getState().content).toEqual({ ratio: "1:1" });
    expect(createContentStore({ ratio: "3:4" }).getState().content).toEqual({ ratio: "3:4" });
    expect(createContentStore({ ratio: "nope" }).getState().content).toEqual({ ratio: "1:1" });
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

  it("loads input over the defaults", () => {
    const store = createContentStore({ ratio: "16:9" });
    store.getState().load(undefined);
    expect(store.getState().content).toEqual(defaultContent());
    store.getState().load({ ratio: "2:3", unknown: true });
    expect(store.getState().content).toEqual({ ratio: "2:3" });
  });
});
