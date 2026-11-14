import { defineConfig } from "tsdown";
import { sharedOptions } from "../../tsdown.shared.ts";

// One entry. React, @veilo/core and @veilo/presets are dependencies, so tsdown leaves them
// external. Every export uses hooks or effects, so the whole entry is a client module: the
// "use client" banner lets React Server Components frameworks import it from server files.
export default defineConfig({ ...sharedOptions, banner: { js: '"use client";' } });
