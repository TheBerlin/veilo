// framework-snippets.ts: the short example of the "Your framework" tile for each way into Veilo:
// the same card (a photo, a title, a price) with one preset, written for each package. They are
// hand-trimmed from the playground's snippet builders, which print the full layout and settings;
// a test checks the package names, the exports and the preset against the real packages.

/** One way into Veilo. */
export interface FrameworkSnippet {
  /** Stable id, used as a key and in tests. */
  id: string;
  /** The name on the switcher. */
  label: string;
  /** The package the snippet imports from, or null when it comes from a CDN script tag. */
  pkg: string | null;
  /** The install command, or null when there is nothing to install. */
  install: string | null;
  /** A line shown where the install command would be, when there is none. */
  note?: string;
  /** The example, 7 or 8 lines, so the examples are about as tall as each other. */
  code: string;
}

/** The preset every example uses. */
export const SNIPPET_PRESET = "dot-upscale";

/** The same three parts in every example's markup, with a slot name on each. */
const PARTS = [
  '<img data-veilo-slot="photo" src="lamp.jpg" alt="Lamp" />',
  '<h2 data-veilo-slot="title">Aero desk lamp</h2>',
  '<p data-veilo-slot="price">$48</p>',
];

/**
 * Indents lines.
 *
 * @param lines - The lines.
 * @param spaces - How many spaces to put before each.
 * @returns The lines joined with newlines.
 */
function indent(lines: readonly string[], spaces: number): string {
  return lines.map((line) => " ".repeat(spaces) + line).join("\n");
}

/** The six examples, in the order of the switcher. */
export const FRAMEWORK_SNIPPETS: readonly FrameworkSnippet[] = [
  {
    id: "react",
    label: "React",
    pkg: "@veilo-ui/react",
    install: "npm install @veilo-ui/react",
    code: [
      'import { Reveal } from "@veilo-ui/react";',
      "",
      `<Reveal preset="${SNIPPET_PRESET}" ready={!loading}>`,
      indent(PARTS, 2),
      "</Reveal>",
    ].join("\n"),
  },
  {
    id: "vue",
    label: "Vue",
    pkg: "@veilo-ui/vue",
    install: "npm install @veilo-ui/vue",
    code: [
      'import { Reveal } from "@veilo-ui/vue";',
      "",
      `<Reveal preset="${SNIPPET_PRESET}" :ready="!loading">`,
      indent(PARTS, 2),
      "</Reveal>",
    ].join("\n"),
  },
  {
    id: "svelte",
    label: "Svelte",
    pkg: "@veilo-ui/svelte",
    install: "npm install @veilo-ui/svelte",
    code: [
      'import { Reveal } from "@veilo-ui/svelte";',
      "",
      `<Reveal preset="${SNIPPET_PRESET}" ready={!loading}>`,
      indent(PARTS, 2),
      "</Reveal>",
    ].join("\n"),
  },
  {
    id: "angular",
    label: "Angular",
    pkg: "@veilo-ui/angular",
    install: "npm install @veilo-ui/angular",
    code: [
      'import { VeiloReveal } from "@veilo-ui/angular";',
      "",
      "// In a component that has `imports: [VeiloReveal]`:",
      `<veilo-reveal preset="${SNIPPET_PRESET}" [ready]="!loading()">`,
      indent(PARTS, 2),
      "</veilo-reveal>",
    ].join("\n"),
  },
  {
    id: "element",
    label: "Web component",
    pkg: "@veilo-ui/element",
    install: "npm install @veilo-ui/element",
    code: [
      'import "@veilo-ui/element/define";',
      "",
      "<!-- Remove `loading` when your data is ready. -->",
      `<veilo-reveal preset="${SNIPPET_PRESET}" loading>`,
      indent(PARTS, 2),
      "</veilo-reveal>",
    ].join("\n"),
  },
  {
    id: "html",
    label: "HTML",
    pkg: null,
    install: null,
    note: "Nothing to install. Remove `loading` when your data is ready.",
    code: [
      '<script type="module"',
      '  src="https://cdn.jsdelivr.net/npm/@veilo-ui/element"></script>',
      "",
      `<veilo-reveal preset="${SNIPPET_PRESET}" loading>`,
      indent(PARTS, 2),
      "</veilo-reveal>",
    ].join("\n"),
  },
];
