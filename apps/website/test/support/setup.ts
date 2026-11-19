// setup.ts: runs before every browser test file and loads the real tokens. An agreed exception
// to the test mirror, as in @veilo-ui/ui.

import "@veilo-ui/ui/tokens.css";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect } from "vitest";
import { page } from "vitest/browser";

// Pin the default (dark) theme; headless Chromium reports a light system preference. The
// playground's tests start on a desktop screen: the browser frame is phone-sized by default, where
// the playground is laid out differently (a bottom row and a settings sheet), so its tests about a
// phone set their own size. The home page's tests keep the default frame.
beforeEach(async () => {
  document.documentElement.dataset.theme = "dark";
  if (expect.getState().testPath?.replaceAll("\\", "/").includes("/test/playground/")) {
    await page.viewport(1440, 900);
  }
});

// Testing Library only cleans up on its own when test globals are on, which they are not here.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
