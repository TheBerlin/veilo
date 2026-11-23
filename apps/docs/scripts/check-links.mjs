// check-links.mjs: checks the links of the built docs (run `pnpm build` first). Every link and image
// that points inside the site must reach a page or file in dist/, and a #fragment must name an id
// on the page it points to. Links to other sites are not followed. Fails with the list of broken
// ones, so a renamed page or a typo in a guide is caught before it ships.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");

/**
 * Lists every file under a folder.
 *
 * @param folder - The folder.
 * @returns Absolute paths.
 */
function walk(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(folder, entry.name)) : [join(folder, entry.name)],
  );
}

/**
 * Finds the file in dist that a site path leads to: the file itself, or the page `index.html` of
 * a folder path.
 *
 * @param path - A path starting with `/`, without a fragment or query.
 * @returns The file's path, or null when nothing is there.
 */
function resolveFile(path) {
  const target = join(dist, decodeURIComponent(path));
  for (const candidate of [target, join(target, "index.html"), `${target}.html`]) {
    if (existsSync(candidate) && !readdirSafe(candidate)) return candidate;
  }
  return null;
}

/**
 * Tells whether a path is a folder.
 *
 * @param path - A path.
 * @returns True for a folder.
 */
function readdirSafe(path) {
  try {
    readdirSync(path);
    return true;
  } catch {
    return false;
  }
}

const pages = walk(dist).filter((file) => file.endsWith(".html"));
/** The ids on each page, read when first needed. */
const idsCache = new Map();

/**
 * The ids (and anchor names) on a built page.
 *
 * @param file - The page's file.
 * @returns A set of ids.
 */
function idsOf(file) {
  if (!idsCache.has(file)) {
    const html = readFileSync(file, "utf8");
    idsCache.set(file, new Set([...html.matchAll(/\b(?:id|name)="([^"]+)"/g)].map((m) => m[1])));
  }
  return idsCache.get(file);
}

const broken = [];
let checked = 0;
for (const page of pages) {
  const html = readFileSync(page, "utf8");
  const here = `/${posix.relative(dist.replaceAll("\\", "/"), page.replaceAll("\\", "/"))}`;
  for (const [, , raw] of html.matchAll(/\b(href|src)="([^"]*)"/g)) {
    // Other sites, mail and scripts are not ours to check.
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(raw) || raw === "") continue;
    const [beforeHash, fragment] = raw.split("#");
    const path = beforeHash.split("?")[0];
    const absolute =
      path === "" ? here : path.startsWith("/") ? path : posix.join(posix.dirname(here), path);
    checked += 1;
    const file = resolveFile(absolute);
    if (!file) {
      broken.push(`${here}: ${raw} (no such page or file)`);
    } else if (
      fragment &&
      file.endsWith(".html") &&
      !idsOf(file).has(decodeURIComponent(fragment))
    ) {
      broken.push(`${here}: ${raw} (no #${fragment} on the page)`);
    }
  }
}

// The same link often appears twice on a page (the menu and the table of contents).
const unique = [...new Set(broken)];
if (unique.length > 0) {
  const noun = unique.length === 1 ? "link" : "links";
  console.error(`${unique.length} broken ${noun}:\n${unique.join("\n")}`);
  process.exit(1);
}
console.log(`Checked ${checked} links on ${pages.length} pages: none broken.`);
