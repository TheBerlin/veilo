// check.mjs: installs the packed @veilo packages into a copy of this example, outside the
// workspace, then serves the page as it is (no build step) and uses it in Chromium. This is how a
// user gets the packages, so it catches what tests inside the repo cannot: cdn.js or
// skeleton.css missing from the package, or a bundle that needs anything besides itself.
// Runs as this example's `e2e` script (Turbo builds the packages first).

import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { serve } from "./serve.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
/** Every @veilo package the installed ones depend on, as workspace folders. */
const PACKAGES = ["core", "presets", "css", "element"];
const PORT = 4176;
const ORIGIN = `http://localhost:${PORT}`;

const work = mkdtempSync(join(tmpdir(), "veilo-element-demo-"));
const packs = join(work, "packs");
const app = join(work, "app");
mkdirSync(packs);
mkdirSync(app);

/**
 * Runs a command and fails the check when it fails. Output is shown as it runs.
 *
 * @param command - The program.
 * @param args - Its arguments.
 * @param cwd - The folder to run it in.
 */
function run(command, args, cwd) {
  // On Windows, npm and pnpm are .cmd scripts, which need a shell.
  execFileSync(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
}

let server;
let browser;
try {
  // 1. Pack: `pnpm pack` turns workspace:* into real versions, exactly as a publish would.
  for (const name of PACKAGES) {
    run("pnpm", ["pack", "--pack-destination", packs, "--silent"], join(repo, "packages", name));
  }
  const tarball = (name) => {
    const file = readdirSync(packs).find((entry) => entry.startsWith(`veilo-${name}-`));
    if (!file) throw new Error(`no tarball for @veilo/${name}`);
    return `file:${join(packs, file)}`;
  };

  // 2. A copy of the page with the tarballs instead of the workspace links.
  for (const file of ["index.html", "serve.mjs"]) copyFileSync(join(here, file), join(app, file));
  const local = Object.fromEntries(PACKAGES.map((name) => [`@veilo/${name}`, tarball(name)]));
  const pkg = {
    name: "veilo-element-demo-check",
    private: true,
    type: "module",
    dependencies: { "@veilo/css": local["@veilo/css"], "@veilo/element": local["@veilo/element"] },
    // The packed packages ask for each other at versions not on npm yet: point every copy of
    // the internal packages at the local tarballs.
    overrides: local,
  };
  writeFileSync(join(app, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);

  // 3. Install with npm, as most users would. There is nothing to build.
  run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], app);
  server = serve(app, PORT);

  // 4. Use the page like a visitor.
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  const requests = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => requests.push(request.url()));
  await page.goto(`${ORIGIN}/`);

  const card = page.locator("veilo-reveal");
  const reviews = page.locator("veilo-skeleton");
  const status = page.getByTestId("status");
  // Loading: the skeletons show on the page's own markup, and the avatar pulses.
  await card.and(page.locator('[aria-busy="true"]')).waitFor();
  await reviews.and(page.locator('[aria-busy="true"]')).waitFor();
  await page.locator('[data-veilo-slot="title"][data-veilo-skeleton]').waitFor();
  await page.locator('[data-veilo-slot="review-2"][aria-hidden="true"]').waitFor();
  if ((await page.locator(".avatar.veilo-pulse").count()) !== 1) throw new Error("no avatar pulse");

  // The data arrives: the dot grid draws the real photo, then the reveal finishes.
  const canvas = card.locator("canvas");
  await canvas.waitFor();
  await page.waitForTimeout(400);
  const inked = await canvas.evaluate((element) => {
    const context = element.getContext("2d");
    const { data } = context.getImageData(0, 0, element.width, element.height);
    let count = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
    return count / (data.length / 4);
  });
  if (inked < 0.02) throw new Error(`the dot grid is nearly empty mid-reveal (${inked})`);
  await status.filter({ hasText: "Revealed" }).waitFor({ timeout: 10_000 });
  if ((await card.getAttribute("aria-busy")) !== null) throw new Error("card still busy");
  if ((await card.locator("canvas").count()) !== 0) throw new Error("grid canvas left behind");
  if ((await reviews.getAttribute("aria-busy")) !== null) throw new Error("reviews still busy");
  if ((await page.locator("[aria-hidden][data-veilo-slot]").count()) !== 0) {
    throw new Error("a slot is still hidden after loading");
  }
  if ((await page.locator(".avatar.veilo-pulse").count()) !== 0) throw new Error("avatar pulses");

  // Reload: back to the skeleton, then revealed again.
  await page.getByRole("button", { name: "Reload" }).click();
  await card.and(page.locator('[aria-busy="true"]')).waitFor();
  await status.filter({ hasText: "Revealed" }).waitFor({ timeout: 10_000 });

  // The page needs nothing besides itself, the bundle and the stylesheet.
  const expected = [
    `${ORIGIN}/`,
    `${ORIGIN}/node_modules/@veilo/css/skeleton.css`,
    `${ORIGIN}/node_modules/@veilo/element/dist/cdn.js`,
  ];
  const fetched = [...new Set(requests.filter((url) => !url.startsWith("data:")))].sort();
  if (JSON.stringify(fetched) !== JSON.stringify(expected)) {
    throw new Error(`unexpected requests:\n${fetched.join("\n")}`);
  }
  if (errors.length > 0) throw new Error(`console errors:\n${errors.join("\n")}`);
  console.log("ok  example-element-demo: packed packages install and the page reveals, no build");
} finally {
  await browser?.close();
  server?.close();
  try {
    rmSync(work, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
  } catch (error) {
    // A leftover temp folder must not hide the check's own result.
    console.warn(`could not remove ${work}: ${error.message}`);
  }
}

// Keep the page and this check in step: the page must load the packages from these paths.
const html = readFileSync(join(here, "index.html"), "utf8");
for (const path of [
  "node_modules/@veilo/element/dist/cdn.js",
  "node_modules/@veilo/css/skeleton.css",
]) {
  if (!html.includes(path)) throw new Error(`index.html no longer loads ${path}`);
}
