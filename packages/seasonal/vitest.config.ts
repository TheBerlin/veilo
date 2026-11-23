import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { configDefaults, defineProject, mergeConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";

// The effects draw on real canvases and read computed styles, so they run in headless Chromium.
// Plain data helpers and the export list stay in Node.
const BROWSER_TESTS = [
  "test/variants.test.ts",
  "test/mount.test.ts",
  "test/react.test.tsx",
  "test/element.test.ts",
];

export default defineProject({
  plugins: [react()],
  test: {
    projects: [
      mergeConfig(shared, {
        test: { name: "seasonal:node", exclude: [...configDefaults.exclude, ...BROWSER_TESTS] },
      }),
      // Spread instead of merged, as in core: mergeConfig would append to the shared include.
      {
        plugins: [react()],
        // Pre-bundle up front; a mid-run re-bundle reloads and duplicates React.
        optimizeDeps: {
          include: [
            "react",
            "react/jsx-dev-runtime",
            "react-dom",
            "react-dom/client",
            "@testing-library/react",
          ],
        },
        test: {
          ...shared.test,
          name: "seasonal:browser",
          include: BROWSER_TESTS,
          setupFiles: ["test/support/setup.ts"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
