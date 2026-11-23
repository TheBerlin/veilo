// Tests for src/gallery/use-snippets.ts: the code a visitor copies is for the right effect, uses
// only entries the package really has, and names a flake form only where it applies.

import { EFFECT_IDS } from "@veilo-ui/seasonal";
import { describe, expect, it } from "vitest";
import { INSTALL_COMMAND, USE_FORMATS, useSnippet } from "../../src/gallery/use-snippets.ts";

describe("useSnippet", () => {
  it("installs the seasonal package", () => {
    expect(INSTALL_COMMAND).toBe("npm install @veilo-ui/seasonal");
  });

  it("names the effect in every format, for every effect", () => {
    for (const id of EFFECT_IDS) {
      for (const { id: format } of USE_FORMATS) {
        expect(useSnippet(format, id, "dendrite"), `${format} ${id}`).toContain(`"${id}"`);
      }
    }
  });

  it("imports only entries the package exports", () => {
    expect(useSnippet("javascript", "frost", "dendrite")).toContain('from "@veilo-ui/seasonal"');
    expect(useSnippet("react", "frost", "dendrite")).toContain('from "@veilo-ui/seasonal/react"');
    expect(useSnippet("element", "frost", "dendrite")).toContain(
      'from "@veilo-ui/seasonal/element"',
    );
  });

  it("writes the flake form when it is not the default and the effect draws a flake", () => {
    expect(useSnippet("javascript", "ice", "fern")).toContain('{ shape: "fern" }');
    expect(useSnippet("react", "ice", "fir")).toContain('shape="fir"');
    expect(useSnippet("element", "ice", "sector")).toContain('shape="sector"');
  });

  it("leaves the form out for the default form and for effects with no flake", () => {
    expect(useSnippet("javascript", "ice", "dendrite")).not.toContain("shape");
    expect(useSnippet("react", "bars", "fern")).not.toContain("shape");
    expect(useSnippet("element", "blizzard", "fir")).not.toContain("shape");
  });

  it("tells the reader to give the effect a size", () => {
    for (const { id: format } of USE_FORMATS) {
      expect(useSnippet(format, "frost", "dendrite"), format).toMatch(/size|width/);
    }
  });
});
