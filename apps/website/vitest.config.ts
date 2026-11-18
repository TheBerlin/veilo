import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineProject } from "vitest/config";
import shared from "../../vitest.shared.ts";

// Page tests need a real DOM, canvas and CSS, so they run in headless Chromium.
export default defineProject({
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
    name: "website",
    setupFiles: ["test/support/setup.ts"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
    },
  },
});
