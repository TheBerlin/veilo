// Tests for the facts the benefits section's captions state, in Node: a claim with a number in it is
// checked against the real file, so it cannot go stale when the file changes.

/// <reference types="node" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { WHY_TILES } from "../../src/home/why-tiles.tsx";

const stylesheet = resolve(
  fileURLToPath(import.meta.url),
  "../../../../../packages/css/skeleton.css",
);

describe("the benefits captions' facts", () => {
  it("the CSS-only caption's size is the real stylesheet's, to the nearest kilobyte", () => {
    const bytes = readFileSync(stylesheet).byteLength;
    const caption = WHY_TILES.find((tile) => tile.id === "css")!.caption;
    const claimed = Number(/(\d+(?:\.\d+)?) KB/.exec(caption)?.[1]);
    expect(Number.isFinite(claimed), "the caption states a size in KB").toBe(true);
    expect(Math.abs(bytes / 1024 - claimed), `${bytes} bytes`).toBeLessThan(0.5);
  });
});
