import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { configDefaults, defineProject, mergeConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";

// Component tests need a real DOM, focus and CSS, so they run in headless Chromium.
// Token tests are plain data and stay in Node.
const BROWSER_TESTS = ["test/components/**/*.test.tsx"];

export default defineProject({
  plugins: [react()],
  test: {
    projects: [
      mergeConfig(shared, {
        test: { name: "ui:node", exclude: [...configDefaults.exclude, ...BROWSER_TESTS] },
      }),
      // Spread instead of merged, as in core: mergeConfig would append to the shared include.
      {
        plugins: [react()],
        test: {
          ...shared.test,
          name: "ui:browser",
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
