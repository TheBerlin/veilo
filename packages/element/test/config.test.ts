// Tests for src/config.ts: the JSON attribute parser.

import { afterEach, describe, expect, it, vi } from "vitest";
import { parseJsonAttribute } from "../src/config.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("parseJsonAttribute", () => {
  it("reads a JSON object", () => {
    expect(parseJsonAttribute('{"effect":"wave"}')).toEqual({ effect: "wave" });
  });

  it("treats an absent or empty attribute as unset", () => {
    expect(parseJsonAttribute(null)).toBeUndefined();
    expect(parseJsonAttribute("  ")).toBeUndefined();
  });

  it("ignores invalid JSON and non-objects with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const value of ["{effect:wave}", "[1]", "3", "null"]) {
      expect(parseJsonAttribute(value)).toBeUndefined();
    }
    expect(warn).toHaveBeenCalledTimes(4);
  });
});
