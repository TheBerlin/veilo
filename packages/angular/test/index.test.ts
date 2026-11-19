// Tests for src/index.ts: the export list is pinned.

import { describe, expect, it } from "vitest";
import * as api from "@veilo-ui/angular";

describe("@veilo-ui/angular", () => {
  it("exports the two components and the two directives, nothing else at run time", () => {
    expect(Object.keys(api).sort()).toEqual([
      "VeiloReveal",
      "VeiloRevealDirective",
      "VeiloSkeleton",
      "VeiloSkeletonDirective",
    ]);
  });
});
