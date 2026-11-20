// check-size.mjs: the docs site's size budget, checked on the built `dist/` (run `pnpm build` first).
// The packages' budgets are in the root `.size-limit.json` and the website's in
// apps/website/scripts/check-size.mjs. Here: each script and stylesheet (gzip), all scripts together,
// each font file and the sample picture. To raise a limit, change it here and say why in the commit.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const KB = 1000;

/** Limits in bytes. Text is measured gzipped; fonts and pictures are already compressed. */
const LIMITS = {
  // The largest script is React's runtime, which the live previews need.
  "each script (gzip)": 50 * KB,
  // Every script of the site added together, if all were loaded.
  "all scripts (gzip)": 105 * KB,
  // The theme and Starlight's styles are one file.
  "each stylesheet (gzip)": 40 * KB,
  "each font (.woff, .woff2)": 20 * KB,
  "sample picture (.webp)": 100 * KB,
};

/** @type {Array<[string, string, number]>} */
const checks = [];
let scripts = 0;
const assets = join(dist, "_astro");
for (const name of readdirSync(assets)) {
  const bytes = readFileSync(join(assets, name));
  if (name.endsWith(".js")) {
    const size = gzipSync(bytes, { level: 9 }).length;
    scripts += size;
    checks.push(["each script (gzip)", `_astro/${name}`, size]);
  } else if (name.endsWith(".css")) {
    checks.push(["each stylesheet (gzip)", `_astro/${name}`, gzipSync(bytes, { level: 9 }).length]);
  } else if (/\.woff2?$/.test(name)) {
    checks.push(["each font (.woff, .woff2)", `_astro/${name}`, bytes.length]);
  }
}
checks.push(["all scripts (gzip)", "_astro/*.js", scripts]);
for (const name of readdirSync(join(dist, "effects")).filter((file) => file.endsWith(".webp"))) {
  checks.push([
    "sample picture (.webp)",
    `effects/${name}`,
    readFileSync(join(dist, "effects", name)).length,
  ]);
}

let failed = false;
for (const [rule, file, size] of checks) {
  const limit = LIMITS[rule];
  const over = size > limit;
  failed ||= over;
  if (over || rule === "all scripts (gzip)") {
    console.log(
      `${over ? "FAIL" : "ok  "} ${file}: ${(size / KB).toFixed(1)} KB, limit ${limit / KB} KB (${rule})`,
    );
  }
}
console.log(`Checked ${checks.length} files.`);
if (failed) {
  console.error("\nThe docs are over their size budget. See apps/docs/scripts/check-size.mjs.");
  process.exit(1);
}
