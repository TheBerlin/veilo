import { describe, expect, it } from "vitest";

describe("@veilo/core", () => {
  it("loads its entry point", async () => {
    await expect(import("./index")).resolves.toBeDefined();
  });
});
