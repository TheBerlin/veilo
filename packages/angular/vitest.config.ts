import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
import { defineProject } from "vitest/config";
import shared from "../../vitest.shared.ts";

// Directives and components drive core on real elements (canvas, layout, observers), so every
// test runs in headless Chromium. The tests import the package as ng-packagr built it (the
// `test` script builds first), so what they check is the published artifact: its partial
// declarations are compiled in the browser by `@angular/compiler`, as an app's linker would.
export default defineProject({
  resolve: {
    alias: {
      "@veilo/angular": fileURLToPath(
        new URL("./dist/fesm2022/veilo-angular.mjs", import.meta.url),
      ),
    },
  },
  test: {
    ...shared.test,
    name: "angular:browser",
    include: ["test/**/*.test.ts"],
    setupFiles: ["test/support/setup.ts"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
    },
  },
});
