import { describe, expect, it } from "vitest";
import * as api from "../src/index.ts";

describe("@veilo/react exports", () => {
  // An API change must update this list and the README.
  it("exports exactly the public API", () => {
    expect(Object.keys(api).sort()).toEqual(["Reveal", "useReveal"]);
  });
});
