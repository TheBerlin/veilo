import { defineConfig } from "tsdown";
import { sharedOptions } from "../../tsdown.shared.ts";

// One entry for now. Lit, @veilo/core and @veilo/presets are dependencies, so tsdown leaves
// them external. tsconfig.build.json covers src only.
export default defineConfig({
  ...sharedOptions,
  tsconfig: "tsconfig.build.json",
});
