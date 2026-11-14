// baselines.spec.ts: the committed screenshots match the list the specs take
// (support/baselines.ts). Catches orphans left by a renamed or removed preset, and screenshots
// added to a spec without being listed. Reads files only, so it runs in one project.

import { readdir } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { expectedBaselines } from "./support/baselines.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "__screenshots__");

test("every baseline belongs to a screenshot, and every screenshot has one", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "dark", "checks files, not a theme");
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => relative(root, resolve(entry.parentPath, entry.name)).split(sep).join("/"))
    .sort();
  const expected = expectedBaselines();
  // Compared as two lists, so a failure names exactly the extra and the missing files.
  expect({
    orphans: files.filter((file) => !expected.includes(file)),
    missing: expected.filter((file) => !files.includes(file)),
  }).toEqual({ orphans: [], missing: [] });
});
