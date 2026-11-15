import { playwright } from "@vitest/browser-playwright";
import { configDefaults, defineProject, mergeConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";

// The elements drive core on real elements (canvas, layout, observers), so they run in headless
// Chromium. Plain data helpers and the export list stay in Node.
const BROWSER_TESTS = [
  "test/define.test.ts",
  "test/reveal-element.test.ts",
  "test/skeleton-element.test.ts",
];

export default defineProject({
  test: {
    projects: [
      mergeConfig(shared, {
        test: { name: "element:node", exclude: [...configDefaults.exclude, ...BROWSER_TESTS] },
      }),
      // Spread instead of merged, as in core: mergeConfig would append to the shared include.
      {
        test: {
          ...shared.test,
          name: "element:browser",
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
