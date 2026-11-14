// playwright.config.ts: visual and end-to-end tests of the built playground (Playwright Test).
// Everything that changes pixels is pinned: browser, viewport, device pixel ratio, fonts (served
// by the app itself), color scheme per project, and the server.

import { defineConfig, devices } from "@playwright/test";

/** Port of the preview server; fixed, so a stray dev server on 5173 is never tested by mistake. */
const PORT = 4173;

export default defineConfig({
  testDir: "e2e",
  // Baselines sit next to the specs, one folder per spec file, without the OS in the name: they
  // are made only in the Playwright Docker image, the same Linux that CI runs.
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{projectName}/{arg}{ext}",
  fullyParallel: true,
  // A stray test.only must not pass CI with the other tests skipped.
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "en-US",
    timezoneId: "UTC",
    trace: "retain-on-failure",
  },
  expect: {
    // Animations (CSS and the Web Animations API) are frozen for every screenshot.
    toHaveScreenshot: { animations: "disabled", caret: "hide", scale: "css" },
  },
  // One project per theme: the playground follows the color scheme when no theme is saved.
  projects: [
    { name: "dark", use: { colorScheme: "dark" } },
    { name: "light", use: { colorScheme: "light" } },
  ],
  webServer: {
    // Serves dist/, so `build` must run first (the Turbo `e2e` task depends on it).
    command: `pnpm exec vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
