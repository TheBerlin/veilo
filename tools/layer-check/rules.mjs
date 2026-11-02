// The layer rules for packages/core/src, as dependency-cruiser rules. Paths are relative to
// packages/core. Layers import only downward, and folders in one layer stay independent.

/** Builds a pattern matching files in the given folders of src/. */
const folders = (...names) => `^src/(${names.join("|")})/`;

/** Builds a rule that forbids one group of files from importing another. */
const forbid = (name, from, to) => ({ name, severity: "error", from, to });

const LAYER_1 = ["grid", "timeline", "dom"];
const LAYER_2 = ["render", "loader", "slots"];
const LAYER_3 = ["controller"];

export const rules = [
  forbid(
    "layer-0-imports-upward",
    { path: folders("schema", "math") },
    { path: folders(...LAYER_1, ...LAYER_2, ...LAYER_3) },
  ),
  forbid(
    "layer-1-imports-upward",
    { path: folders(...LAYER_1) },
    { path: folders(...LAYER_2, ...LAYER_3) },
  ),
  forbid("layer-2-imports-upward", { path: folders(...LAYER_2) }, { path: folders(...LAYER_3) }),

  // math/easing needs the Settings type, so types may cross between the two layer 0 folders.
  forbid(
    "math-imports-schema-value",
    { path: folders("math") },
    { path: folders("schema"), dependencyTypesNot: ["type-only"] },
  ),
  forbid(
    "schema-imports-math-value",
    { path: folders("schema") },
    { path: folders("math"), dependencyTypesNot: ["type-only"] },
  ),

  // Pure modules never reach the browser. grid/sample and grid/ramps need a canvas, so they
  // are the only layer 1 files that may use dom/.
  forbid(
    "layer-1-folders-stay-independent",
    { path: folders("timeline", "dom") },
    { path: folders(...LAYER_1), pathNot: "^src/$1/" },
  ),
  forbid(
    "pure-grid-imports-dom",
    { path: "^src/grid/", pathNot: "^src/grid/(sample|ramps)\\.ts$" },
    { path: folders("dom", "timeline") },
  ),
  forbid(
    "grid-imports-timeline",
    { path: "^src/grid/(sample|ramps)\\.ts$" },
    { path: folders("timeline") },
  ),
  forbid(
    "layer-2-folders-stay-independent",
    { path: folders(...LAYER_2) },
    { path: folders(...LAYER_2), pathNot: "^src/$1/" },
  ),

  // index.ts is the public entry, so internal code never imports it.
  forbid("imports-public-entry", {}, { path: "^src/index\\.ts$" }),

  // A broken import would otherwise be skipped without a sound.
  forbid("unresolved-import", {}, { couldNotResolve: true }),
];
