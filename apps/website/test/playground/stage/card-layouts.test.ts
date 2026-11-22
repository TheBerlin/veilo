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
    it(`${layout.id}: every editable part is a text or block slot of the layout, once`, () => {
      const parts = layout.texts.map((part) => part.slot);
      expect(new Set(parts).size).toBe(parts.length);
      // A part is a text slot, or a block that holds text (the video's duration badge).
      for (const slot of parts) expect(["text", "block"]).toContain(layout.slots[slot]?.role);
    });

    it(`${layout.id}: its picture is the one image slot, and the inbox has none`, () => {
      const images = Object.entries(layout.slots)
        .filter(([, hint]) => hint.role === "image")
        .map(([name]) => name);
      expect(images).toEqual(layout.picture ? [layout.picture.slot] : []);
    });
  }

  it("lists every layout once, starting with the default, and narrows unknown ids", () => {
    expect(LAYOUT_IDS[0]).toBe(DEFAULT_LAYOUT);
    expect(new Set(LAYOUT_IDS).size).toBe(3);
    expect(toLayoutId("video")).toBe("video");
    expect(toLayoutId("grid")).toBeUndefined();
    expect(toLayoutId(3)).toBeUndefined();
  });

  it("finds default text, and an empty string for an unknown slot", () => {
    expect(defaultText(CARD_LAYOUTS.music, "artist")).toBe("Blue Meridian");
    expect(defaultText(CARD_LAYOUTS.music, "nope")).toBe("");
  });
});
