import { defineConfig } from "tsdown";
import { sharedOptions } from "../../tsdown.shared.ts";

// Two public entries. Code they share goes into chunk files, and the grid renderer, which
// createReveal loads with import(), gets a chunk of its own.
export default defineConfig({
  ...sharedOptions,
  entry: { index: "src/index.ts", loader: "src/loader-entry.ts" },
});
