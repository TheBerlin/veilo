import { defineConfig } from "tsdown";
import { sharedOptions } from "../../tsdown.shared.ts";

// One entry. Vue, @veilo-ui/core and @veilo-ui/presets are dependencies, so tsdown leaves them
// external. tsconfig.build.json covers src only, so the tests' imports from core never reach the
// build.
export default defineConfig({
  ...sharedOptions,
  tsconfig: "tsconfig.build.json",
});
