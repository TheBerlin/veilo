// Tests for src/stage/snap-to-pixel.ts, in Chromium (needs real layout). The file is .tsx so it
// runs in the browser project, not in Node.

import { afterEach, describe, expect, it } from "vitest";
import { snapToWholePixel, watchWholePixel } from "../../../src/playground/stage/snap-to-pixel.ts";

/**
 * Builds a stage whose card is centered by auto margins, as in the app, in a box where the
 * leftover space is odd, so the card starts on a half pixel.
 *
 * @param stageHeight - Height of the stage in px.
 * @returns The stage and its card.
 */
function build(stageHeight: number) {
  const stage = document.createElement("section");
  stage.style.cssText = `display:flex;flex-direction:column;height:${stageHeight}px;margin:0;`;
  const card = document.createElement("article");
  card.style.cssText = "position:relative;height:100px;margin-block:auto;";
  stage.append(card);
  document.body.append(stage);
  return { stage, card };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("snapToWholePixel", () => {
  it("moves a card at a half pixel onto a whole pixel", () => {
    const { card } = build(201); // (201 - 100) / 2 = 50.5
    expect(card.getBoundingClientRect().top).toBe(50.5);
    snapToWholePixel(card);
    expect(Number.isInteger(card.getBoundingClientRect().top)).toBe(true);
    expect(Math.abs(card.getBoundingClientRect().top - 50.5)).toBeLessThanOrEqual(0.5);
  });

  it("leaves a card that is already on a whole pixel alone", () => {
    const { card } = build(200);
    snapToWholePixel(card);
    expect(card.style.top).toBe("");
  });

  it("measures from the layout, so calling it twice gives the same position", () => {
    const { card } = build(201);
    snapToWholePixel(card);
    const once = card.getBoundingClientRect().top;
    snapToWholePixel(card);
    expect(card.getBoundingClientRect().top).toBe(once);
  });
});

describe("watchWholePixel", () => {
  it("snaps now and again when the stage resizes, and stops after cleanup", async () => {
    const { stage, card } = build(201);
    const stop = watchWholePixel(stage);
    expect(Number.isInteger(card.getBoundingClientRect().top)).toBe(true);

    stage.style.height = "301px"; // 100.5
    await expect.poll(() => Number.isInteger(card.getBoundingClientRect().top)).toBe(true);

    stop();
    stage.style.height = "350px"; // 125, plus the old nudge of 0.5 if nothing watches
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(Number.isInteger(card.getBoundingClientRect().top)).toBe(false);
  });
});
