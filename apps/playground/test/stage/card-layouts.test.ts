import { describe, expect, it } from "vitest";
import { CARD_LAYOUTS, defaultText } from "../../src/stage/card-layouts.ts";

describe("card layouts", () => {
  for (const layout of Object.values(CARD_LAYOUTS)) {
    it(`${layout.id}: every text slot has one text part, in the table`, () => {
      const textSlots = Object.entries(layout.slots)
        .filter(([, hint]) => hint.role === "text")
        .map(([name]) => name)
        .sort();
      expect(layout.texts.map((part) => part.slot).sort()).toEqual(textSlots);
    });

    it(`${layout.id}: has an image slot only when it has a ratio`, () => {
      const hasImage = Object.values(layout.slots).some((hint) => hint.role === "image");
      expect(hasImage).toBe(layout.hasRatio);
    });
  }

  it("finds default text, and an empty string for an unknown slot", () => {
    expect(defaultText(CARD_LAYOUTS.product, "label")).toBe("Buy now");
    expect(defaultText(CARD_LAYOUTS.product, "nope")).toBe("");
  });
});
