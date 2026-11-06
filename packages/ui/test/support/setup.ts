// setup.ts: runs before every browser test file and loads the real tokens. An agreed exception
// to the test mirror.

import "../../tokens.css";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
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

// Testing Library only cleans up on its own when test globals are on, which they are not here.
afterEach(() => {
  cleanup();
});
