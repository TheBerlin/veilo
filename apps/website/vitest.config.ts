import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { configDefaults, defineProject } from "vitest/config";
import shared from "../../vitest.shared.ts";

// Page tests need a real DOM, canvas and CSS, so they run in headless Chromium. The playground's
// state, export and storage tests are plain data and stay in Node.
const NODE_TESTS = ["test/playground/{state,export,stage,presets,share,panel}/**/*.test.ts"];

export default defineProject({
  plugins: [react()],
  test: {
    projects: [
      { test: { ...shared.test, name: "website:node", include: NODE_TESTS } },
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
            "@radix-ui/react-popover",
            "vaul",
            "sonner",
            "zustand",
            "zustand/vanilla",
          ],
        },
        test: {
          ...shared.test,
          name: "website:browser",
          exclude: [...configDefaults.exclude, ...NODE_TESTS],
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
