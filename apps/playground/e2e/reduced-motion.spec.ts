// reduced-motion.spec.ts: what changes when the viewer prefers reduced motion (spec 3.7).
// Loaders from @veilo/css stop, core's reveal jumps to the end without being told, the
// playground's preview keeps animating on purpose, and the playground's own chrome stands still.
// Its Reduced motion switch shows the reduced experience on demand.
// Each check that expects stillness has a control without the preference, so it cannot pass
// just because nothing ran.

import { readFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { CSS_DEMO_NAME } from "./support/baselines.ts";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const cssDemo = pathToFileURL(resolve(repo, "examples/css-demo/index.html")).href;
const coreDist = resolve(repo, "packages/core/dist");

/** A made-up origin for the core test page; Playwright answers its requests, nothing goes out. */
const CORE_ORIGIN = "http://veilo.test";

/**
 * A page that runs core's built reveal with no `reducedMotion` option, so core must read the
 * preference itself. It records every progress and state event in `window.revealLog`, and the
 * text slot's animation name while the skeleton shows.
 */
const CORE_PAGE = `<!doctype html>
<html lang="en">
  <body>
    <div id="card">
      <canvas data-veilo-slot="photo" width="160" height="160"></canvas>
      <p data-veilo-slot="title">Reduced motion</p>
    </div>
    <script type="module">
      import { createReveal } from "/core/index.mjs";
      const canvas = document.querySelector("canvas");
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, 160, 160);
      context.fillStyle = "#202020";
      context.fillRect(40, 30, 80, 100);
      const title = document.querySelector("[data-veilo-slot=title]");
      const log = (window.revealLog = { progress: [], states: [], loadingAnimation: null, done: false });
      const reveal = createReveal(document.getElementById("card"), { hold: 0.3 });
      reveal.on("progress", (p) => log.progress.push(p));
      reveal.on("state", (state) => {
        log.states.push(state);
        // Read after the skeleton's style is applied.
        if (state === "loading") {
          requestAnimationFrame(() => (log.loadingAnimation = getComputedStyle(title).animationName));
        }
      });
      reveal.on("complete", () => (log.done = true));
      reveal.playSequence();
    </script>
  </body>
</html>`;

/** What the core page records. */
interface RevealLog {
  progress: number[];
  states: string[];
  loadingAnimation: string | null;
  done: boolean;
}

/**
 * Serves the core page and core's built files on {@link CORE_ORIGIN}, runs one sequence, and
 * returns what it recorded.
 *
 * @param page - The test's page.
 * @returns The recorded events, once the sequence completed.
 */
async function runCoreSequence(page: Page): Promise<RevealLog> {
  await page.route(`${CORE_ORIGIN}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/") {
      await route.fulfill({ contentType: "text/html", body: CORE_PAGE });
      return;
    }
    // /core/<file> maps to packages/core/dist/<file>, including the lazily imported grid chunk.
    const file = resolve(coreDist, path.replace(/^\/core\//, ""));
    if (!path.startsWith("/core/") || !file.startsWith(coreDist)) {
      await route.fulfill({ status: 404 });
      return;
    }
    const type = extname(file) === ".mjs" ? "text/javascript" : "application/octet-stream";
    await route.fulfill({ contentType: type, body: await readFile(file) });
  });
  await page.goto(`${CORE_ORIGIN}/`);
  await page.waitForFunction(() => (window as unknown as { revealLog: RevealLog }).revealLog.done);
  return page.evaluate(() => (window as unknown as { revealLog: RevealLog }).revealLog);
}

/** The animated loader classes of skeleton.css; the plain `veilo` class is static by design. */
const ANIMATED = ".veilo-shimmer, .veilo-wave, .veilo-pulse";

/**
 * Reads the computed animation name of every element matching a selector.
 *
 * @param page - The test's page.
 * @param selector - A CSS selector.
 * @returns One animation name per element, in page order.
 */
function animationNames(page: Page, selector: string): Promise<string[]> {
  return page
    .locator(selector)
    .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).animationName));
}

/**
 * Reads the playground's base interface duration token as computed by the browser.
 *
 * @param page - The test's page, on the playground.
 * @returns The duration in its unit (the browser may write 0s or 0ms), as a number.
 */
async function baseDuration(page: Page): Promise<number> {
  const value = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--veilo-duration-base").trim(),
  );
  return parseFloat(value);
}

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("CSS loaders stop and rest on the base color", async ({ page }, testInfo) => {
    // The demo page has its own light and dark cards, so one theme project is enough.
    test.skip(testInfo.project.name !== "dark", "the demo shows both themes itself");
    await page.goto(cssDemo);
    const animations = await animationNames(page, ANIMATED);
    expect(animations.length).toBeGreaterThan(0);
    expect(new Set(animations)).toEqual(new Set(["none"]));
    // Not frozen by Playwright: the stylesheet itself must leave them still.
    await expect(page).toHaveScreenshot(CSS_DEMO_NAME, { fullPage: true, animations: "allow" });
  });

  test("core's reveal skips the animation without being told", async ({ page }) => {
    const log = await runCoreSequence(page);
    expect(log.loadingAnimation).toBe("none");
    expect(log.states).toEqual(["loading", "revealing", "revealed"]);
    // Straight to the end: no frame between the first and the last.
    expect(log.progress.filter((p) => p > 0 && p < 1)).toEqual([]);
    expect(log.progress.at(-1)).toBe(1);
  });

  test("the playground's preview still animates", async ({ page }) => {
    await page.goto("/");
    // The skeleton too (before 0.6.0 its CSS still followed the preference and stood still).
    // Read once the card has started it, not while the page is still mounting.
    await page.locator('[data-veilo-slot="heading"][data-veilo-skeleton]').waitFor();
    expect(await animationNames(page, '[data-veilo-slot="heading"]')).toEqual([
      expect.stringMatching(/^veilo-skeleton-/),
    ]);
    // The state label passes through the reveal, as without the preference.
    await expect(page.getByRole("status").filter({ hasText: /Revealing [1-9]\d?%/ })).toBeVisible();
  });

  test("the playground's chrome stands still", async ({ page }) => {
    await page.goto("/");
    expect(await baseDuration(page)).toBe(0);
  });
});

test.describe("without reduced motion (controls)", () => {
  test.use({ reducedMotion: "no-preference" });

  test("CSS loaders animate", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "dark", "the demo shows both themes itself");
    await page.goto(cssDemo);
    const animations = await animationNames(page, ANIMATED);
    expect(animations.length).toBeGreaterThan(0);
    expect(animations.every((name) => name !== "none")).toBe(true);
  });

  test("core's reveal animates through intermediate progress", async ({ page }) => {
    const log = await runCoreSequence(page);
    expect(log.loadingAnimation).not.toBe("none");
    expect(log.progress.filter((p) => p > 0 && p < 1).length).toBeGreaterThan(0);
  });

  test("the playground's chrome moves", async ({ page }) => {
    await page.goto("/");
    expect(await baseDuration(page)).toBeGreaterThan(0);
  });

  test("the playground's reduced-motion preview shows the reduced experience", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("switch", { name: "Reduced motion" }).click();
    await expect(page.getByRole("status")).toHaveText("Loading");
    await page.locator('[data-veilo-slot="heading"][data-veilo-skeleton]').waitFor();
    expect(await animationNames(page, '[data-veilo-slot="heading"]')).toEqual(["none"]);
    // Record every label until the end; none may show a frame in between.
    await page.evaluate(() => {
      const status = document.querySelector('[role="status"]')!;
      const seen: string[] = [];
      (window as unknown as { seen: string[] }).seen = seen;
      new MutationObserver(() => seen.push(status.textContent ?? "")).observe(status, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    });
    await expect(page.getByRole("status")).toHaveText("Revealed", { timeout: 10_000 });
    const seen = await page.evaluate(() => (window as unknown as { seen: string[] }).seen);
    expect(seen.filter((label) => /Revealing [1-9]/.test(label))).toEqual([]);
  });
});
