import { defineConfig } from "tsdown";
import { sharedOptions } from "../../tsdown.shared.ts";

// Two builds. tsconfig.build.json covers src only, so test helpers never reach either.
export default defineConfig([
  // The npm entries `@veilo-ui/element` and `@veilo-ui/element/define`. Lit, @veilo-ui/core and
  // @veilo-ui/presets are dependencies, so they stay external and apps share one copy.
  {
    ...sharedOptions,
    entry: { index: "src/index.ts", define: "src/define-entry.ts" },
    tsconfig: "tsconfig.build.json",
  },
  // The CDN bundle `cdn.js`: one minified ES module with every dependency inside, for a plain
  // `<script type="module">` (jsDelivr and unpkg serve it as the package's default file).
  {
    entry: { cdn: "src/cdn.ts" },
    tsconfig: "tsconfig.build.json",
    format: "esm",
    platform: "browser",
    dts: false,
    sourcemap: true,
    minify: true,
    // The first build cleans dist; cleaning here could delete its output.
    clean: false,
    deps: { alwaysBundle: [/.*/] },
    // Core loads the grid renderer with import(); inline it so the bundle stays one request.
    outputOptions: { codeSplitting: false },
    outExtensions: () => ({ js: ".js" }),
    // A production build: core's slot warnings stay off unless `options.warnings` is set, and
    // bundled code reads no `process`.
    define: { "process.env.NODE_ENV": '"production"' },
  },
]);
