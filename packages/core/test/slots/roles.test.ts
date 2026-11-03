// Tests for src/slots/roles.ts. Runs in Chromium (see BROWSER_TESTS in vitest.config.ts).

import { describe, expect, it } from "vitest";
import { canBeImage, guessRole } from "../../src/slots/roles.ts";

const make = (tag: string) => document.createElement(tag);

describe("guessRole", () => {
  it.each([
    ["img", "image"],
    ["canvas", "image"],
    ["button", "button"],
    ["video", "block"],
    ["p", "text"],
    ["h3", "text"],
    ["span", "text"],
    ["div", "text"],
  ])("guesses <%s> as %s", (tag, role) => {
    expect(guessRole(make(tag))).toBe(role);
  });
});

describe("canBeImage", () => {
  it("accepts only <img> and <canvas>", () => {
    expect(
      ["img", "canvas", "video", "picture", "div"].map((tag) => canBeImage(make(tag))),
    ).toEqual([true, true, false, false, false]);
  });

  it("works for elements whose tag name is lower case, as in an XHTML document", () => {
    const xhtml = document.implementation.createDocument("http://www.w3.org/1999/xhtml", "html");
    const img = xhtml.createElementNS("http://www.w3.org/1999/xhtml", "img");
    expect(img.tagName).toBe("img");
    expect(canBeImage(img)).toBe(true);
    expect(guessRole(xhtml.createElementNS("http://www.w3.org/1999/xhtml", "button"))).toBe(
      "button",
    );
  });
});
