// Fails when packages/core/src breaks the layer rules, or touches window or document
// outside src/dom/. Run with `pnpm check:layers`.
//
// This package has its own TypeScript 6 because dependency-cruiser cannot read TypeScript 7
// yet. On TypeScript 7 it scans nothing and still reports success, so the file count below
// is a required guard, not a nicety.
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { cruise } from "dependency-cruiser";
import { rules } from "./rules.mjs";

process.chdir(fileURLToPath(new URL("../../packages/core/", import.meta.url)));

const sourceFiles = readdirSync("src", { recursive: true })
  .map((file) => `src/${String(file).replaceAll("\\", "/")}`)
  .filter((file) => file.endsWith(".ts"));

const { output } = await cruise(
  ["src"],
  { ruleSet: { forbidden: rules }, tsPreCompilationDeps: true, validate: true },
  { extensions: [".ts"] },
);
const { summary } = output;

const problems = summary.violations.map(
  (violation) => `${violation.rule.name}: ${violation.from} -> ${violation.to}`,
);

if (summary.totalCruised < sourceFiles.length) {
  problems.push(`scanned ${summary.totalCruised} of ${sourceFiles.length} source files`);
}

for (const file of sourceFiles.filter((name) => !name.startsWith("src/dom/"))) {
  // Comments may mention the words freely, so remove them first.
  const code = readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  const global = /\b(window|document)\b/.exec(code);
  if (global) problems.push(`browser-global: ${file} uses ${global[1]}, use src/dom/ instead`);
}

if (problems.length > 0) {
  console.error(`Layer check failed:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`Layer check passed: ${summary.totalCruised} files.`);
