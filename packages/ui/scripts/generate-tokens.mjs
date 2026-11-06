// generate-tokens.mjs: writes tokens.css from src/tokens-css.ts.
// Run with `pnpm --filter @veilo/ui generate:tokens` after changing src/tokens.ts.

import { writeFileSync } from "node:fs";
import { buildTokensCss } from "../src/tokens-css.ts";

writeFileSync(new URL("../tokens.css", import.meta.url), buildTokensCss());
console.log("Wrote tokens.css");
