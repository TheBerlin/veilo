// generate-stylesheet.mjs: writes skeleton.css from src/stylesheet.ts.
// Run with `pnpm --filter @veilo/css generate:stylesheet` after changing the generator.

import { writeFileSync } from "node:fs";
import { buildStylesheet } from "../src/stylesheet.ts";

writeFileSync(new URL("../skeleton.css", import.meta.url), buildStylesheet());
console.log("Wrote skeleton.css");
