// Tests for src/home/framework-snippets.ts, in Node: every example is checked against the real
// packages in this repository, so a renamed export, package or preset fails here and not on the
// page.

/// <reference types="node" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PRESETS } from "@veilo-ui/presets";
import { describe, expect, it } from "vitest";
import { FRAMEWORK_SNIPPETS, SNIPPET_PRESET } from "../../src/home/framework-snippets.ts";

const packages = resolve(fileURLToPath(import.meta.url), "../../../../../packages");

/**
 * Reads a file of a package of this repository.
 *
 * @param pkg - The package's folder name, such as `react`.
 * @param path - The file's path inside it.
 * @returns The file's text.
 */
function read(pkg: string, path: string): string {
  return readFileSync(resolve(packages, pkg, path), "utf8");
}

/** The folder and the export each package's example imports. */
const EXPORTS: Record<string, { folder: string; name: string }> = {
  react: { folder: "react", name: "Reveal" },
  vue: { folder: "vue", name: "Reveal" },
  svelte: { folder: "svelte", name: "Reveal" },
  angular: { folder: "angular", name: "VeiloReveal" },
};

describe("FRAMEWORK_SNIPPETS", () => {
  it("has the six ways in, in the order of the switcher", () => {
    expect(FRAMEWORK_SNIPPETS.map((item) => item.label)).toEqual([
      "React",
      "Vue",
      "Svelte",
      "Angular",
      "Web component",
      "HTML",
    ]);
    expect(new Set(FRAMEWORK_SNIPPETS.map((item) => item.id)).size).toBe(6);
  });

  it("uses a preset that exists", () => {
    expect(PRESETS.map((preset) => preset.id)).toContain(SNIPPET_PRESET);
    for (const item of FRAMEWORK_SNIPPETS)
      expect(item.code).toContain(`preset="${SNIPPET_PRESET}"`);
  });

  it("shows the same three parts, each with a slot name, in every example", () => {
    for (const item of FRAMEWORK_SNIPPETS) {
      for (const slot of ["photo", "title", "price"]) {
        expect(item.code, `${item.id}: ${slot}`).toContain(`data-veilo-slot="${slot}"`);
      }
    }
  });

  it("keeps each example short, and about as tall as the others", () => {
    for (const item of FRAMEWORK_SNIPPETS) {
      expect(item.code.split("\n").length, item.id).toBeLessThanOrEqual(9);
    }
  });

  for (const item of FRAMEWORK_SNIPPETS.filter((candidate) => candidate.id in EXPORTS)) {
    const { folder, name } = EXPORTS[item.id]!;
    it(`${item.label}: the package, the install command and the export are real`, () => {
      expect(JSON.parse(read(folder, "package.json")).name).toBe(item.pkg);
      expect(item.install).toBe(`npm install ${item.pkg}`);
      expect(item.code).toContain(`import { ${name} } from "${item.pkg}";`);
      // The export is in the package's entry file.
      expect(read(folder, "src/index.ts")).toMatch(new RegExp(`\\b${name}\\b`));
    });
  }

  it("Web component: the define entry exists and the element is the one the page uses", () => {
    const item = FRAMEWORK_SNIPPETS.find((candidate) => candidate.id === "element")!;
    const manifest = JSON.parse(read("element", "package.json"));
    expect(manifest.name).toBe(item.pkg);
    expect(item.install).toBe(`npm install ${item.pkg}`);
    expect(Object.keys(manifest.exports)).toContain("./define");
    expect(item.code).toContain(`import "${item.pkg}/define";`);
    expect(item.code).toContain("<veilo-reveal");
    expect(read("element", "src/define.ts")).toContain("veilo-reveal");
  });

  it("HTML: one script tag from a CDN, with nothing to install", () => {
    const item = FRAMEWORK_SNIPPETS.find((candidate) => candidate.id === "html")!;
    const manifest = JSON.parse(read("element", "package.json"));
    expect(item.install).toBeNull();
    expect(item.code).toContain(
      `<script type="module" src="https://cdn.jsdelivr.net/npm/${manifest.name}"></script>`,
    );
    // The CDN serves the file named by the package's `jsdelivr` field.
    expect(manifest.jsdelivr).toBeTruthy();
  });
});
