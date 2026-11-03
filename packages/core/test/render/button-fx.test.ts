// Tests for src/render/button-fx.ts, from the spec's button background fade.
// Runs in Chromium (see BROWSER_TESTS in vitest.config.ts).

import { afterEach, describe, expect, it } from "vitest";
import { applyButtonFrame, BUTTON_ALPHA_PROPERTY } from "../../src/render/button-fx.ts";

afterEach(() => {
  document.body.replaceChildren();
});

describe("applyButtonFrame", () => {
  it("uses the --veilo-bg-a property", () => {
    expect(BUTTON_ALPHA_PROPERTY).toBe("--veilo-bg-a");
  });

  it.each([
    [0, "0"],
    [0.25, "0.25"],
    [1, "1"],
    [1.2, "1"],
    [-0.1, "0"],
  ])("sets --veilo-bg-a to the label's eased progress %s, clamped", (eased, value) => {
    const button = document.createElement("button");
    applyButtonFrame(button, eased);
    expect(button.style.getPropertyValue("--veilo-bg-a")).toBe(value);
  });

  it("drives a background that reads the property", () => {
    const button = document.createElement("button");
    button.style.background = "rgb(3 3 3 / var(--veilo-bg-a, 1))";
    document.body.append(button);
    applyButtonFrame(button, 0.5);
    expect(getComputedStyle(button).backgroundColor).toBe("rgba(3, 3, 3, 0.5)");
  });
});
