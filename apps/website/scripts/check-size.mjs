// check-size.mjs: the website's size budget, checked on the built `dist/` (run `pnpm build` first).
// The packages' budgets are in the root `.size-limit.json`; this is separate because the site's
// files have hashed names that change with every build. It fails when the page's first-load
// JavaScript or CSS (gzip), the lazy grid chunk, or any recorded clip, poster or image is over its
// limit. To raise a limit, change it here and say why in the commit.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const KB = 1000;

/** Limits in bytes. Gzip sizes for text, plain file sizes for media (already compressed). */
const LIMITS = {
  // Everything the first page load runs: the entry script and the stylesheet from index.html.
  "first-load JavaScript (gzip)": 160 * KB,
  "first-load CSS (gzip)": 40 * KB,
  // The grid renderer, loaded only when an effect draws the grid.
  "lazy grid chunk (gzip)": 5 * KB,
  // Media: a clip, its poster, and any other picture.
  "each clip (.webm)": 200 * KB,
  "each poster (.jpg)": 80 * KB,
  "each image (.webp, .png)": 100 * KB,
};

/**
 * Gzip size of a built file.
 *
 * @param file - Path inside dist.
 * @returns Bytes.
 */
const gzipped = (file) => gzipSync(readFileSync(join(dist, file)), { level: 9 }).length;

const html = readFileSync(join(dist, "index.html"), "utf8");
const script = /<script[^>]*type="module"[^>]*src="\/?([^"]+)"/.exec(html)?.[1];
const style = /<link[^>]*rel="stylesheet"[^>]*href="\/?([^"]+)"/.exec(html)?.[1];
if (!script || !style) throw new Error("dist/index.html has no entry script or stylesheet");

/** @type {Array<[string, string, number]>} */
const checks = [
  ["first-load JavaScript (gzip)", script, gzipped(script)],
  ["first-load CSS (gzip)", style, gzipped(style)],
];
for (const name of readdirSync(join(dist, "assets"))) {
  const file = `assets/${name}`;
  const size = statSync(join(dist, file)).size;
  if (/^grid-renderer-.*\.js$/.test(name))
    checks.push(["lazy grid chunk (gzip)", file, gzipped(file)]);
  else if (name.endsWith(".webm")) checks.push(["each clip (.webm)", file, size]);
  else if (name.endsWith(".jpg")) checks.push(["each poster (.jpg)", file, size]);
  else if (/\.(webp|png)$/.test(name)) checks.push(["each image (.webp, .png)", file, size]);
}

let failed = false;
for (const [rule, file, size] of checks) {
  const limit = LIMITS[rule];
  const over = size > limit;
  failed ||= over;
  console.log(
    `${over ? "FAIL" : "ok  "} ${file}: ${(size / KB).toFixed(1)} KB, limit ${limit / KB} KB (${rule})`,
  );
}
if (failed) {
  console.error("\nThe site is over its size budget. See apps/website/scripts/check-size.mjs.");
  process.exit(1);
}
