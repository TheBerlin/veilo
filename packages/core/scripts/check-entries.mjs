// Checks the built package the way users load it: every public entry is imported in plain Node by
// its package name (so the exports map is tested too), as ESM and as CommonJS, while any access to
// window or document throws. Also checks that the grid code stays out of the main entry's static
// imports. Run after `pnpm build`: `pnpm --filter @veilo/core check:entries`.

import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

// The grid renderer must only be reachable through import(), never through a static import.
const staticImports = (file, seen = new Set()) => {
  if (seen.has(file)) return seen;
  seen.add(file);
  const code = readFileSync(join(root, "dist", file), "utf8");
  for (const [, dep] of code.matchAll(/from\s*"\.\/([^"]+)"/g)) staticImports(dep, seen);
  return seen;
};
for (const file of staticImports("index.mjs")) {
  if (readFileSync(join(root, "dist", file), "utf8").includes("function measureRamp")) {
    problems.push(`the grid code is statically imported by the main entry (${file})`);
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`error  ${problem}`);
  process.exit(1);
}
console.log("All entries load in Node without browser globals, and the grid code is split off.");
