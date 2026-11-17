import { playwright } from "@vitest/browser-playwright";
import { configDefaults, defineProject, mergeConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";

// Components and the composable drive core on real elements (canvas, layout, observers), so they
// run in headless Chromium. Plain data helpers and server rendering stay in Node. The components
// are render functions, so no Vue compiler plugin is needed.
const BROWSER_TESTS = ["test/reveal.test.ts", "test/skeleton.test.ts", "test/use-reveal.test.ts"];

export default defineProject({
  test: {
    projects: [
      mergeConfig(shared, {
        test: { name: "vue:node", exclude: [...configDefaults.exclude, ...BROWSER_TESTS] },
      }),
      // Spread instead of merged, as in core: mergeConfig would append to the shared include.
      {
        // Pre-bundle up front; a mid-run re-bundle reloads and duplicates Vue.
        optimizeDeps: { include: ["vue", "@vue/test-utils"] },
        test: {
          ...shared.test,
          name: "vue:browser",
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
