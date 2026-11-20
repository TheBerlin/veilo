/* global document */
// record-clips.mjs: records the short silent clips of the real playground that "How it works" shows
// (Tune and Export), in dark and light, as WebM files in src/home/assets/clips/. Not part of CI: the
// committed files are the source, and this is re-run by hand after a change to the playground's UI.
//
// Usage (the site must be served; the default is the dev server on 127.0.0.1:8123):
//   node scripts/record-clips.mjs [--base http://127.0.0.1:8123] [--only tune|export]

import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "..", "src", "home", "assets", "clips");
const TMP = join(here, "..", "test-results", "clips");

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : fallback;
};
const BASE = option("base", "http://127.0.0.1:8123");
const ONLY = option("only", "");

/** The size of the page and of the video. */
const SIZE = { width: 960, height: 600 };

/** A pause, in milliseconds. */
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Adds the cursor dot and the caption bar to the page; both live outside the app's own markup. */
const OVERLAY = () => {
  const style = document.createElement("style");
  style.textContent = `
    #clip-cursor{position:fixed;z-index:99999;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;
      border-radius:50%;background:rgba(255,255,255,.9);border:2px solid #16161a;pointer-events:none;
      transition:transform .55s cubic-bezier(.4,0,.2,1);box-shadow:0 2px 8px rgba(0,0,0,.4)}
    #clip-cursor.down{scale:.75}
    #clip-caption{position:fixed;z-index:99999;left:50%;top:92px;translate:-50% 0;padding:8px 16px;
      border-radius:999px;font:500 15px/20px Geist,system-ui,sans-serif;background:#16161a;color:#e2e2e7;
      border:1px solid #72717e;pointer-events:none;opacity:0;transition:opacity .25s}
    #clip-caption.on{opacity:1}`;
  document.head.append(style);
  const cursor = document.createElement("div");
  cursor.id = "clip-cursor";
  cursor.style.transform = "translate(900px, 700px)";
  const caption = document.createElement("div");
  caption.id = "clip-caption";
  document.body.append(cursor, caption);
};

/**
 * Moves the cursor dot to the middle of an element and waits for it to arrive.
 *
 * @param page - The page.
 * @param locator - The target.
 */
async function moveTo(page, locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("target has no box");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.evaluate(
    ([px, py]) => {
      document.getElementById("clip-cursor").style.transform = `translate(${px}px, ${py}px)`;
    },
    [x, y],
  );
  await page.mouse.move(x, y, { steps: 8 });
  await pause(450);
}

/**
 * Clicks with a visible press.
 *
 * @param page - The page.
 * @param locator - The target.
 */
async function press(page, locator) {
  await moveTo(page, locator);
  await page.evaluate(() => document.getElementById("clip-cursor").classList.add("down"));
  await pause(120);
  await locator.click();
  await page.evaluate(() => document.getElementById("clip-cursor").classList.remove("down"));
}

/**
 * Shows a caption, or hides it with an empty string.
 *
 * @param page - The page.
 * @param text - The words.
 */
async function say(page, text) {
  await page.evaluate((words) => {
    const caption = document.getElementById("clip-caption");
    if (words) caption.textContent = words;
    caption.classList.toggle("on", Boolean(words));
  }, text);
}

/** The scripts: what each clip does once the playground is open. */
const CLIPS = {
  async tune(page) {
    await say(page, "Pick a card");
    await press(page, page.getByRole("tab", { name: "Content" }));
    const layout = page.getByLabel("Layout");
    await moveTo(page, layout);
    await layout.selectOption({ label: "Profile header" });
    await pause(1100);
    await layout.selectOption({ label: "List row" });
    await pause(1100);
    await say(page, "Choose a preset");
    await press(page, page.getByRole("radio", { name: "Hex from center" }));
    await pause(1500);
    await say(page, "Tune it");
    await press(page, page.getByRole("tab", { name: "Reveal" }));
    const slider = page.getByRole("slider").first();
    const box = await slider.boundingBox();
    await moveTo(page, slider);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 90, box.y + box.height / 2, { steps: 14 });
    await page.mouse.up();
    await pause(1500);
    await say(page, "");
  },
  async export(page) {
    await say(page, "Export it");
    await press(page, page.getByRole("button", { name: "Export", exact: true }));
    await pause(900);
    const format = page.getByLabel("Format");
    await moveTo(page, format);
    await format.selectOption({ label: "React" });
    await pause(1600);
    await say(page, "Copy the code");
    const copy = page.getByRole("button", { name: /^Copy/ }).last();
    await press(page, copy);
    await pause(1800);
    await say(page, "");
  },
};

/**
 * The ffmpeg that Playwright installs for its own video recording, so no separate install is
 * needed. It is a trimmed build: enough to cut and re-encode VP9 WebM.
 *
 * @returns The path of the executable.
 */
function playwrightFfmpeg() {
  const root =
    process.env.PLAYWRIGHT_BROWSERS_PATH ||
    (process.platform === "win32"
      ? join(process.env.LOCALAPPDATA ?? "", "ms-playwright")
      : join(homedir(), ".cache", "ms-playwright"));
  const folder = readdirSync(root).find((name) => name.startsWith("ffmpeg-"));
  if (!folder) throw new Error("Playwright's ffmpeg is not installed");
  const exe = process.platform === "win32" ? "ffmpeg-win64.exe" : "ffmpeg-linux";
  return join(root, folder, exe);
}

/** Seconds cut from the start of every clip: the page loading before the script begins. */
const TRIM_START = 1.6;

mkdirSync(OUT, { recursive: true });
rmSync(TMP, { recursive: true, force: true });
const browser = await chromium.launch();
for (const [name, script] of Object.entries(CLIPS)) {
  if (ONLY && ONLY !== name) continue;
  for (const scheme of ["dark", "light"]) {
    const context = await browser.newContext({
      viewport: SIZE,
      colorScheme: scheme,
      reducedMotion: "no-preference",
      recordVideo: { dir: TMP, size: SIZE },
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      try {
        // The playground follows the color scheme when no theme is saved; nothing else is kept.
        localStorage.clear();
      } catch {
        // storage blocked: nothing to clear
      }
    });
    await page.goto(`${BASE}/playground`);
    await page.getByRole("button", { name: "Export", exact: true }).waitFor();
    await pause(1500);
    await page.evaluate(OVERLAY);
    await script(page);
    const video = page.video();
    await context.close();
    const file = `${name}-${scheme}.webm`;
    // Cut the page load and re-encode small: 20 fps, constant quality, no audio.
    execFileSync(playwrightFfmpeg(), [
      "-y",
      "-loglevel",
      "error",
      "-ss",
      String(TRIM_START),
      "-i",
      await video.path(),
      "-an",
      "-r",
      "20",
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      "40",
      "-row-mt",
      "1",
      join(OUT, file),
    ]);
    // A still of the first calm moment, for the poster (reduced motion and before load).
    execFileSync(playwrightFfmpeg(), [
      "-y",
      "-loglevel",
      "error",
      "-ss",
      "0.2",
      "-i",
      join(OUT, file),
      "-frames:v",
      "1",
      join(OUT, `${name}-${scheme}.png`),
    ]);
    console.log("wrote", file, Math.round(statSync(join(OUT, file)).size / 1024), "KB");
  }
}
await browser.close();
writeFileSync(join(OUT, ".gitkeep"), "");
console.log(readdirSync(OUT).join("\n"));
