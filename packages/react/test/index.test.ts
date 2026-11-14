// Tests for src/index.ts. Runs in Node, which also shows the components render on a server
// without a browser.

import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as api from "../src/index.ts";

describe("@veilo/react exports", () => {
  // An API change must update this list and the README.
  it("exports exactly the public API", () => {
    expect(Object.keys(api).sort()).toEqual(["Reveal", "Skeleton", "useReveal"]);
  });

  it("renders the skeleton on a server, with no browser", () => {
    expect(typeof document).toBe("undefined");
    const slot = createElement("p", { "data-veilo-slot": "line" }, "Text");
    const reveal = renderToString(createElement(api.Reveal, { ready: false }, slot));
    expect(reveal).toContain("data-veilo-ssr");
    expect(reveal).toContain("<style>");
    expect(reveal).toContain("[data-veilo-slot]");
    const skeleton = renderToString(createElement(api.Skeleton, { loading: true }, slot));
    expect(skeleton).toContain("data-veilo-ssr");
  });
});
