// setup.ts: runs before every browser test file and loads the real tokens. An agreed exception
// to the test mirror, as in @veilo-ui/ui.

import "@veilo-ui/ui/tokens.css";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import { page } from "vitest/browser";

// Pin the default (dark) theme; headless Chromium reports a light system preference. Start on a
// desktop screen: the browser frame is phone-sized by default, where the app is laid out
// differently (a bottom row and a settings sheet), so tests about a phone set their own size.
beforeEach(async () => {
  document.documentElement.dataset.theme = "dark";
  await page.viewport(1440, 900);
});

// Testing Library only cleans up on its own when test globals are on, which they are not here.
// Storage is cleared after the unmount, so no test starts on a session or presets saved by
// another one (the App saves its settings as they change).
afterEach(() => {
  cleanup();
  localStorage.clear();
});
