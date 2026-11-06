// setup.ts: runs before every browser test file and loads the real tokens. An agreed exception
// to the test mirror.

import "../../tokens.css";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

// Headless Chromium reports a light system preference. Pin the default (dark) theme so colors
// in the tests do not depend on the machine; a test that needs light sets it itself.
beforeEach(() => {
  document.documentElement.dataset.theme = "dark";
});

// Testing Library only cleans up on its own when test globals are on, which they are not here.
afterEach(() => {
  cleanup();
});
