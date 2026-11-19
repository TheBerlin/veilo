// check.mjs: installs the packed @veilo packages into a copy of this example, outside the
// workspace, then typechecks, builds and runs it in Chromium. This is how a user gets the
// packages, so it catches what tests inside the repo cannot: files missing from the package,
// a broken exports map, missing types, or dependencies that do not resolve once packed.
// Runs as this example's `e2e` script (Turbo builds the packages first).

import { execFileSync, spawn } from "node:child_process";
import {
  cpSync,
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

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
/** The packages a user installs for this example, as workspace folders. */
const PACKAGES = ["core", "presets", "svelte"];
const PORT = 4179;

const work = mkdtempSync(join(tmpdir(), "veilo-svelte-demo-"));
const packs = join(work, "packs");
const app = join(work, "app");
mkdirSync(packs);

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
    const file = readdirSync(packs).find((entry) => entry.startsWith(`veilo-ui-${name}-`));
    if (!file) throw new Error(`no tarball for @veilo-ui/${name}`);
    return `file:${join(packs, file)}`;
  };

  // 2. A copy of the example with the tarballs instead of the workspace link.
  for (const entry of [
    "index.html",
    "src",
    "tsconfig.json",
    "vite.config.ts",
    "svelte.config.js",
  ]) {
    cpSync(join(here, entry), join(app, entry), { recursive: true });
  }
  const own = JSON.parse(readFileSync(join(here, "package.json"), "utf8"));
  const local = Object.fromEntries(PACKAGES.map((name) => [`@veilo-ui/${name}`, tarball(name)]));
  const pkg = {
    name: "veilo-svelte-demo-check",
    private: true,
    type: "module",
    dependencies: { ...own.dependencies, "@veilo-ui/svelte": local["@veilo-ui/svelte"] },
    devDependencies: { ...own.devDependencies },
    // The packed @veilo-ui/svelte asks for @veilo-ui/core at its version, which is not on npm yet:
    // point every copy of the internal packages at the local tarballs.
    overrides: local,
  };
  delete pkg.devDependencies.playwright;
  writeFileSync(join(app, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);

  // 3. Install with npm, as most users would, then typecheck and build.
  run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], app);
  run("npx", ["svelte-check", "--tsconfig", "./tsconfig.json"], app);
  run("npx", ["vite", "build", "--logLevel", "warn"], app);

  // 4. Serve the build and use it like a visitor.
  server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
    cwd: app,
    stdio: "ignore",
    shell: process.platform === "win32",
  });
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(error.message));
  for (let attempt = 0; ; attempt++) {
    try {
      await page.goto(`http://localhost:${PORT}/`);
      break;
    } catch (error) {
      if (attempt > 50) throw error;
      await new Promise((done) => setTimeout(done, 200));
    }
  }

  const card = page.locator("article.card");
  const status = page.getByTestId("status");
  // Loading: the skeleton shows on the card's own parts, and on the avatar.
  await card.and(page.locator('[aria-busy="true"]')).waitFor();
  await page.locator('[data-veilo-slot="title"][data-veilo-skeleton]').waitFor();
  await page.locator(".avatar[data-veilo-skeleton]").waitFor();

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
  if ((await page.locator(".avatar[data-veilo-skeleton]").count()) !== 0) {
    throw new Error("avatar still shows the skeleton");
  }

  // Reload: back to the skeleton, then revealed again.
  await page.getByRole("button", { name: "Reload" }).click();
  await card.and(page.locator('[aria-busy="true"]')).waitFor();
  await status.filter({ hasText: "Revealed" }).waitFor({ timeout: 10_000 });

  if (errors.length > 0) throw new Error(`console errors:\n${errors.join("\n")}`);
  console.log("ok  example-svelte-demo: packed packages install, typecheck, build and reveal");
} finally {
  await browser?.close();
  if (server?.pid) {
    // On Windows the server runs under a shell; kill the whole tree, or Vite keeps the folder.
    if (process.platform === "win32") {
      try {
        execFileSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
      } catch {
        // Already gone.
      }
    } else server.kill();
  }
  try {
    rmSync(work, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
  } catch (error) {
    // A leftover temp folder must not hide the check's own result.
    console.warn(`could not remove ${work}: ${error.message}`);
  }
}
