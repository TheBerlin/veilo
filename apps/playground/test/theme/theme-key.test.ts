// Tests that the playground's first-paint theme script reads the key @veilo/ui saves under.

import { THEME_STORAGE_KEY } from "@veilo/ui";
import { describe, expect, it } from "vitest";
import indexHtml from "../../index.html?raw";

describe("theme key", () => {
  it("is the one the script in index.html reads", () => {
    expect(indexHtml).toContain(`localStorage.getItem("${THEME_STORAGE_KEY}")`);
  });
});
