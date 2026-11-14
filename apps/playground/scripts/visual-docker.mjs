// visual-docker.mjs: runs the playground's Playwright tests inside the official Playwright Docker
// image, the same Linux that CI uses, so screenshots match CI pixel for pixel. Arguments are
// passed to `playwright test` (`--update-snapshots` writes new baselines).
//
// The repository is mounted read-only and copied inside the container without node_modules,
// because the Windows node_modules hold Windows-only binaries and must not be overwritten.
// Only the screenshot baselines, the report and the test results are written back.

import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Must equal the `playwright` and `@playwright/test` versions in package.json. */
const IMAGE = "mcr.microsoft.com/playwright:v1.64.1-noble";
/** Must equal `packageManager` in the root package.json. */
const PNPM = "pnpm@10.28.0";
/** Named Docker volume that keeps pnpm's store between runs, so installs after the first are fast. */
const STORE_VOLUME = "veilo-pnpm-store";

const app = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(app, "../..");

// Folders written back to the host; they must exist before Docker mounts them.
const outputs = {
  "e2e/__screenshots__": resolve(app, "e2e/__screenshots__"),
  "playwright-report": resolve(app, "playwright-report"),
  "test-results": resolve(app, "test-results"),
};
for (const path of Object.values(outputs)) mkdirSync(path, { recursive: true });

const work = "/work/apps/playground";
const mounts = Object.entries(outputs).flatMap(([inside, host]) => [
  "-v",
  `${host}:${work}/${inside}`,
]);

// Arguments reach the script as "$@", never pasted into the shell text.
const script = [
  "set -e",
  // Copy the sources; the output folders are mounted already and are left out.
  "cd /src",
  "tar -cf - --exclude=node_modules --exclude=dist --exclude=.turbo --exclude=.git" +
    " --exclude=apps/playground/e2e/__screenshots__ --exclude=apps/playground/playwright-report" +
    " --exclude=apps/playground/test-results . | tar -xf - -C /work",
  "cd /work",
  `npm install --global --silent ${PNPM}`,
  "pnpm config set store-dir /pnpm-store",
  "pnpm install --frozen-lockfile --reporter=silent",
  "pnpm exec turbo run build --filter=playground --output-logs=errors-only",
  `cd ${work}`,
  'pnpm exec playwright test "$@"',
].join("\n");

const result = spawnSync(
  "docker",
  [
    "run",
    "--rm",
    // Chromium needs more shared memory than Docker's default; Playwright's docs ask for this.
    "--ipc=host",
    "-e",
    "CI=1",
    "-v",
    `${repo}:/src:ro`,
    "-v",
    `${STORE_VOLUME}:/pnpm-store`,
    ...mounts,
    IMAGE,
    "bash",
    "-c",
    script,
    "visual-docker",
    ...process.argv.slice(2),
  ],
  { stdio: "inherit" },
);

if (result.error) {
  console.error(`Could not start Docker (${result.error.message}). Is Docker Desktop running?`);
  process.exit(1);
}
process.exit(result.status ?? 1);
