import { defineConfig } from "tsdown";
import { sharedOptions } from "../../tsdown.shared.ts";

// One entry. @veilo-ui/core is a dependency, so tsdown leaves it external instead of bundling it.
export default defineConfig(sharedOptions);
