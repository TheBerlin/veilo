import { describe, expect, it } from "vitest";
import {
  CARD_LAYOUTS,
  DEFAULT_LAYOUT,
  defaultText,
  LAYOUT_IDS,
  toLayoutId,
} from "../../../src/playground/stage/card-layouts.ts";

describe("card layouts", () => {
  for (const layout of Object.values(CARD_LAYOUTS)) {
    it(`${layout.id}: every text slot has one text part, in the table`, () => {
      const textSlots = Object.entries(layout.slots)
        .filter(([, hint]) => hint.role === "text")
        .map(([name]) => name)
        .sort();
      expect(layout.texts.map((part) => part.slot).sort()).toEqual(textSlots);
    });

    it(`${layout.id}: has the photo slot as its one image`, () => {
      const images = Object.entries(layout.slots).filter(([, hint]) => hint.role === "image");
      expect(images.map(([name]) => name)).toEqual(["photo"]);
    });
  }

  it("lists every layout once, starting with the default, and narrows unknown ids", () => {
    expect(LAYOUT_IDS[0]).toBe(DEFAULT_LAYOUT);
    expect(new Set(LAYOUT_IDS).size).toBe(5);
    expect(toLayoutId("list")).toBe("list");
    expect(toLayoutId("grid")).toBeUndefined();
    expect(toLayoutId(3)).toBeUndefined();
  });

  it("finds default text, and an empty string for an unknown slot", () => {
    expect(defaultText(CARD_LAYOUTS.product, "label")).toBe("Buy now");
    expect(defaultText(CARD_LAYOUTS.product, "nope")).toBe("");
  });
});
