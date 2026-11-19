// Tests for src/index.ts. Runs in Node, which also shows the entry imports with no browser.

import { describe, expect, it } from "vitest";
import * as api from "../src/index.ts";

describe("@veilo-ui/element exports", () => {
  // An API change must update this list and the README.
  it("exports exactly the public API", () => {
    expect(Object.keys(api).sort()).toEqual([
      "COMPLETE_EVENT",
      "ELEMENT_TAGS",
      "VeiloRevealElement",
      "VeiloSkeletonElement",
      "defineVeiloElements",
    ]);
  });

  it("registers nothing on import", () => {
    expect(typeof document).toBe("undefined");
    expect(api.ELEMENT_TAGS).toEqual({ reveal: "veilo-reveal", skeleton: "veilo-skeleton" });
  });
});
