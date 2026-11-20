// generate-changelog.mjs: writes src/content/docs/reference/changelog.md from the CHANGELOG.md of
// each published package, so the page is always what the release tooling wrote. Plain Markdown, not
// MDX, because the entries contain text that MDX would read as code. The page is not committed (it is
// in .gitignore); `pnpm dev` and `pnpm build` make it.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** The published packages, in the order they appear. The internal UI package has no entry. */
const PACKAGES = ["core", "css", "presets", "react", "vue", "svelte", "angular", "element"];

const sections = PACKAGES.map((name) => {
  const text = readFileSync(join(here, "..", "..", "..", "packages", name, "CHANGELOG.md"), "utf8");
  // Each file starts with its package name as a title; the rest are versions. Everything moves down
  // one level, so the package name is the page's second level and a version the third.
  const body = text
    .replace(/^# .*\r?\n/, "")
    .replace(/^(#{2,5}) /gm, (_, hashes) => `${hashes}# `)
    .trim();
  return `## @veilo-ui/${name}\n\n${body}\n`;
});

const page = `---
title: Changelog
description: What changed in each Veilo release, per package, written by the release tooling.
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 2
---

All packages share one version number and move together, so a package with no changes in a release says so. Entries from before the scope was renamed to \`@veilo-ui\` use the old names \`@veilo/*\`, and are kept as they were.

${sections.join("\n")}`;

const out = join(here, "..", "src", "content", "docs", "reference");
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "changelog.md"), page);
console.log(`Wrote reference/changelog.md (${PACKAGES.length} packages).`);
