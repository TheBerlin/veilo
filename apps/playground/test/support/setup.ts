// setup.ts: runs before every browser test file and loads the real tokens. An agreed exception
// to the test mirror, as in @veilo/ui.

import "@veilo/ui/tokens.css";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

// Pin the default (dark) theme; headless Chromium reports a light system preference.
beforeEach(() => {
  document.documentElement.dataset.theme = "dark";
});

// Testing Library only cleans up on its own when test globals are on, which they are not here.
// Storage is cleared after the unmount, so no test starts on a session or presets saved by
// another one (the App saves its settings as they change).
afterEach(() => {
  cleanup();
  localStorage.clear();
});
