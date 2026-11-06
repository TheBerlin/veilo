// Tests for test/support/parse-css.ts: the checker catches what lightningcss lets through.

import { describe, expect, it } from "vitest";
import { cssProblems } from "./parse-css.ts";

describe("cssProblems", () => {
  it("passes clean CSS, including var() values", () => {
    expect(cssProblems(".a { color: red; background: var(--b, #fff); }")).toEqual([]);
  });

  it("catches an unclosed block", () => {
    expect(cssProblems(".a { color: red;")).toEqual(['1 "{" but 0 "}"']);
  });

  it("catches a value that does not parse", () => {
    expect(cssProblems(".a { animation: x 1s cubic-bezier(1, 2); }")).toEqual([
      "cannot parse animation",
    ]);
  });
});
