// check.mjs: fails when the demo no longer matches the package it shows. Runs as this
// example's `test` script, so CI catches a moved stylesheet or a renamed class.

import { existsSync, readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const html = readFileSync(new URL("index.html", import.meta.url), "utf8");
const problems = [];

// The <link> must point at the file the package exports as @veilo/css/skeleton.css.
const href = html.match(/<link rel="stylesheet" href="([^"]+)"/)?.[1];
const linked = href && new URL(href, import.meta.url);
const exported = fileURLToPath(import.meta.resolve("@veilo/css/skeleton.css"));
if (!linked || !existsSync(linked)) {
  problems.push(`stylesheet link ${href} does not exist`);
} else if (realpathSync(linked) !== realpathSync(exported)) {
  problems.push(`stylesheet link ${href} is not the exported @veilo/css/skeleton.css`);
}

// Every veilo class the page uses must exist in the stylesheet.
const css = readFileSync(exported, "utf8");
// The lookbehind skips custom properties such as --veilo-base.
const used = new Set(html.match(/(?<![-\w])veilo(?:-[a-z]+)?\b/g));
for (const name of used) {
  if (!css.includes(`.${name}`)) problems.push(`class ${name} is not in skeleton.css`);
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`css-demo: link and ${used.size} classes match @veilo/css`);
