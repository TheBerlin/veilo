import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The latest release is the version of the core package: the fixed-mode release moves every
// package to the same number. The gallery labels an effect "New" while its `since` equals it.
const core = JSON.parse(
  readFileSync(new URL("../../packages/core/package.json", import.meta.url), "utf8"),
) as { version: string };

// The website app. `pnpm --filter website dev` serves it; `build` writes dist/.
export default defineConfig({
  plugins: [react()],
  define: { __VEILO_RELEASE__: JSON.stringify(core.version) },
});
