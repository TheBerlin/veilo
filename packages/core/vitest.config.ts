import { playwright } from "@vitest/browser-playwright";
import { configDefaults, defineProject, mergeConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";

// Test files whose source needs a real canvas or DOM. They run in headless Chromium; everything
// else stays in Node. Add a path here when its first browser module lands.
const BROWSER_TESTS = [
  "test/dom/**/*.test.ts",
  "test/grid/sample.test.ts",
  "test/grid/ramps.test.ts",
  "test/render/**/*.test.ts",
  "test/loader/skeleton.test.ts",
  "test/controller/reveal.test.ts",
];

export default defineProject({
  test: {
    projects: [
      mergeConfig(shared, {
        test: { name: "core:node", exclude: [...configDefaults.exclude, ...BROWSER_TESTS] },
      }),
      // Spread instead of merged, because mergeConfig would append to the shared include list
      // and run every Node test in the browser too.
      {
        test: {
          ...shared.test,
          name: "core:browser",
          include: BROWSER_TESTS,
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
