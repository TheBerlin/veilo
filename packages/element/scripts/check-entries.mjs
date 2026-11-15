// Checks the built package the way users load it. The npm entries are imported in plain Node by
// their package name (so the exports map is tested too), as ESM and as CommonJS, while any access
// to window or document throws; `/define` must register nothing there. The CDN bundle must be
// one self-contained file, and in Chromium a bare page that loads only it must register both
// elements, run a skeleton, and make no other request. Run after `pnpm build`:
// `pnpm --filter @veilo/element check:entries`.

// The page.evaluate callback below runs in the browser, where these exist.
/* global customElements, document */

import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const require = createRequire(import.meta.url);
const problems = [];

// Server rendering must work: touching a browser global while loading is an error.
for (const name of ["window", "document"]) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    get() {
      throw new Error(`${name} was accessed while loading`);
    },
  });
}

for (const [subpath, target] of Object.entries(pkg.exports)) {
  const specifier = `${pkg.name}${subpath.slice(1)}`;
  if (typeof target === "string") {
    if (!existsSync(join(root, target))) problems.push(`${specifier}: ${target} is missing`);
    continue;
  }
  for (const file of [target.import.types, target.require.types]) {
    if (!existsSync(join(root, file))) problems.push(`${specifier}: ${file} is missing`);
  }
  try {
    const esm = await import(specifier);
    const cjs = require(specifier);
    const esmKeys = Object.keys(esm).sort().join(",");
    const cjsKeys = Object.keys(cjs).sort().join(",");
    if (esmKeys !== cjsKeys) problems.push(`${specifier}: ESM and CommonJS export different names`);
    console.log(`ok  ${specifier} (${Object.keys(esm).length} exports)`);
  } catch (error) {
    problems.push(`${specifier}: ${error.message}`);
  }
}
for (const name of ["window", "document"]) delete globalThis[name];

// The CDN fields must name the bundle, and the bundle must not import anything.
const cdnFile = join(root, "dist", "cdn.js");
for (const field of ["jsdelivr", "unpkg"]) {
  if (pkg[field] !== "./dist/cdn.js") problems.push(`package.json ${field} must be ./dist/cdn.js`);
}
const cdn = readFileSync(cdnFile, "utf8");
const imports = [...cdn.matchAll(/\bimport\s*\(|\bfrom\s*["'`]|^\s*import\s*["'`]/gm)];
if (imports.length > 0) problems.push(`cdn.js imports other files (${imports.length} imports)`);
if (/\bprocess\./.test(cdn)) problems.push("cdn.js reads process, which a browser does not have");

// A bare page with only the bundle, served from a fake origin so nothing else can load.
const ORIGIN = "http://veilo.test";
const PAGE = `<!doctype html><meta charset="utf-8">
<script type="module" src="/cdn.js"></script>
<veilo-skeleton loading><p data-veilo-slot="line">Text</p></veilo-skeleton>
<veilo-reveal loading><h2 data-veilo-slot="title">Title</h2></veilo-reveal>`;
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  const others = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (url === `${ORIGIN}/`) return route.fulfill({ contentType: "text/html", body: PAGE });
    if (url === `${ORIGIN}/cdn.js`) {
      return route.fulfill({ contentType: "text/javascript", body: cdn });
    }
    others.push(url);
    return route.abort();
  });
  await page.goto(`${ORIGIN}/`);
  const state = await page.evaluate(async () => {
    await customElements.whenDefined("veilo-reveal");
    await customElements.whenDefined("veilo-skeleton");
    const reveal = document.querySelector("veilo-reveal");
    const skeleton = document.querySelector("veilo-skeleton");
    await reveal.updateComplete;
    await skeleton.updateComplete;
    return {
      reveal: reveal.reveal?.state,
      revealBusy: reveal.getAttribute("aria-busy"),
      skeletonBusy: skeleton.getAttribute("aria-busy"),
      line: skeleton.querySelector("p").getAttribute("aria-hidden"),
    };
  });
  const expected = { reveal: "loading", revealBusy: "true", skeletonBusy: "true", line: "true" };
  if (JSON.stringify(state) !== JSON.stringify(expected)) {
    problems.push(`cdn.js on a bare page: ${JSON.stringify(state)}`);
  }
  for (const error of errors) problems.push(`cdn.js on a bare page: ${error}`);
  for (const url of others) problems.push(`cdn.js on a bare page requested ${url}`);
  console.log(`ok  cdn.js (${(cdn.length / 1024).toFixed(1)} KB) runs on a bare page`);
} finally {
  await browser.close();
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`error  ${problem}`);
  process.exit(1);
}
console.log("All entries load in Node without browser globals, and cdn.js stands alone.");
