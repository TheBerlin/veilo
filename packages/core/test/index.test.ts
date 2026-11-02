// Tests for src/index.ts: the entry point loads.

import { describe, expect, it } from "vitest";

describe("@veilo/core", () => {
  it("loads its entry point", async () => {
    await expect(import("../src/index.ts")).resolves.toBeDefined();
  });
});
