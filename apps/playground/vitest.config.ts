import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { configDefaults, defineProject, mergeConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";

// Stage tests need a real DOM, canvas and CSS, so they run in headless Chromium. State tests are
// plain data and stay in Node.
const BROWSER_TESTS = ["test/stage/**/*.test.tsx"];

export default defineProject({
  plugins: [react()],
  test: {
    projects: [
      mergeConfig(shared, {
        test: { name: "playground:node", exclude: [...configDefaults.exclude, ...BROWSER_TESTS] },
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
            "@testing-library/user-event",
            "@radix-ui/react-slider",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toggle-group",
            "@radix-ui/react-toggle",
            "@radix-ui/react-tooltip",
            "zustand",
            "zustand/vanilla",
          ],
        },
        test: {
          ...shared.test,
          name: "playground:browser",
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
