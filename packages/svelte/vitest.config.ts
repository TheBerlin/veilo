import { svelte } from "@sveltejs/vite-plugin-svelte";
import { playwright } from "@vitest/browser-playwright";
import { configDefaults, defineProject, mergeConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";

// Components and actions drive core on real elements (canvas, layout, observers), so they run in
// headless Chromium. The export list and server rendering stay in Node. Test files that use
// runes are named `*.svelte.test.ts`, so the Svelte plugin compiles them.
const BROWSER_TESTS = ["test/reveal.svelte.test.ts", "test/skeleton.svelte.test.ts"];

export default defineProject({
  test: {
    projects: [
      mergeConfig(shared, {
        plugins: [svelte()],
        test: { name: "svelte:node", exclude: [...configDefaults.exclude, ...BROWSER_TESTS] },
      }),
      // Spread instead of merged, as in core: mergeConfig would append to the shared include.
      {
        plugins: [svelte()],
        // Pre-bundle up front; a mid-run re-bundle reloads and duplicates Svelte.
        optimizeDeps: { include: ["svelte"] },
        test: {
          ...shared.test,
          name: "svelte:browser",
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
