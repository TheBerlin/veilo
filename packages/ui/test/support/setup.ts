// setup.ts: runs before every browser test file and loads the real tokens. An agreed exception
// to the test mirror.

import "../../tokens.css";
// The real font, as the playground loads it: without it, text is measured in whatever sans font
// the machine has, which is wider on the Linux CI runner than on Windows, so layout tests that
// measure text (a row of tabs) would pass on one and fail on the other.
import "@fontsource/geist/400.css";
import "@fontsource/geist/500.css";
import "@fontsource/geist/700.css";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach } from "vitest";
import { userEvent } from "vitest/browser";

// Park the real mouse in the bottom-right corner before each test. Testing Library's events do
// not move it, so wherever Playwright left it (different per OS) would otherwise put a component
// under the cursor and apply its :hover style. Found on the Linux CI runner.
beforeEach(async () => {
  const corner = document.createElement("div");
  corner.style.cssText = "position: fixed; right: 0; bottom: 0; width: 2px; height: 2px";
  document.body.append(corner);
  await userEvent.hover(corner);
  corner.remove();
});

// Headless Chromium reports a light system preference. Pin the default (dark) theme so colors
// in the tests do not depend on the machine; a test that needs light sets it itself.
beforeEach(() => {
  document.documentElement.dataset.theme = "dark";
  // Instant transitions, as under reduced motion, so styles can be read right after a change.
  for (const name of ["fast", "base", "slow"]) {
    document.documentElement.style.setProperty(`--veilo-duration-${name}`, "0ms");
  }
});

// Load the faces before the first test: fonts load lazily, on first use, so a test that measures
// text right after rendering would otherwise see the fallback font.
beforeAll(async () => {
  await Promise.all(
    ["400", "500", "700"].map((weight) => document.fonts.load(`${weight} 14px Geist`)),
  );
});

// Testing Library only cleans up on its own when test globals are on, which they are not here.
afterEach(() => {
  cleanup();
});
