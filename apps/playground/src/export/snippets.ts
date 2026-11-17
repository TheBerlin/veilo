// snippets.ts: the code the Export tab shows for the current card: its markup with
// `data-veilo-slot` names, the layout JSON, and the vanilla JS, React, web component and CDN
// snippets built on them. Pure text in, text out: no DOM, no React, so a Node script can build
// the same snippets and run them.

import type { Layout, Settings } from "@veilo/core";
import { CARD_LAYOUTS, defaultText, type CardLayoutId } from "../stage/card-layouts.ts";

/** What a snippet is built from: the layout, the user's text and width, and the settings. */
export interface SnippetInput {
  /** The card layout. */
  layoutId: CardLayoutId;
  /** The user's text for this layout, by slot; parts without an entry use the default. */
  texts?: Record<string, string>;
  /** The card width in CSS px; the layout's own width when absent. */
  width?: number;
  /**
   * The settings to write into the snippet. Pass only the keys that differ from the defaults
   * (see {@link changedSettings}): core fills in the rest, and the snippet stays short.
   */
  settings: Partial<Settings>;
}

/** One element of the snippet markup. */
interface MarkupNode {
  /** The tag name. */
  tag: string;
  /** The `data-veilo-slot` name, when the element animates. */
  slot?: string;
  /** The slot name whose text the element holds. */
  text?: string;
  /** The elements inside, for containers. */
  children?: MarkupNode[];
}

/** The image of a layout: a real `img`, which core samples. */
const PHOTO: MarkupNode = { tag: "img", slot: "photo" };

/** A text part: a tag and the slot it holds. */
const part = (tag: string, slot: string): MarkupNode => ({ tag, slot, text: slot });

/**
 * A button with its label inside. A real `button` is guessed as the button role, and the span
 * inside as its label.
 */
const BUY: MarkupNode = {
  tag: "button",
  slot: "buy",
  children: [part("span", "label")],
};

/**
 * The markup of each layout, in page order. It is the playground card's markup with real
 * elements: the card itself is a `role=button` element, so there "Buy now" is a span.
 */
const MARKUP: Record<CardLayoutId, MarkupNode[]> = {
  product: [
    PHOTO,
    part("h2", "heading"),
    part("p", "line1"),
    part("p", "line2"),
    { tag: "div", children: [part("span", "price"), part("span", "oldPrice")] },
    BUY,
  ],
  list: [
    PHOTO,
    { tag: "div", children: [part("h2", "heading"), part("p", "line1")] },
    part("span", "price"),
  ],
  profile: [
    {
      tag: "div",
      children: [PHOTO, { tag: "div", children: [part("h2", "heading"), part("p", "line1")] }],
    },
    part("p", "line2"),
    BUY,
  ],
  article: [
    PHOTO,
    part("p", "tag"),
    part("h2", "heading"),
    part("p", "line1"),
    part("p", "line2"),
    part("p", "meta"),
  ],
  table: [
    PHOTO,
    { tag: "div", children: [part("h2", "heading"), part("p", "line1")] },
    part("p", "category"),
    part("p", "stock"),
    part("span", "price"),
  ],
};

/** The markup syntaxes the snippets use. */
type Syntax = "html" | "jsx";

/**
 * Escapes text for HTML.
 *
 * @param text - Plain text.
 * @returns Text safe between tags.
 */
function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Writes text as markup content. JSX reads `{`, `}`, `<` and `>` as syntax, so text with them
 * becomes a string expression.
 *
 * @param text - Plain text.
 * @param syntax - HTML or JSX.
 * @returns The content to put between tags.
 */
function content(text: string, syntax: Syntax): string {
  if (syntax === "html") return escapeHtml(text);
  return /[{}<>]/.test(text) ? `{${JSON.stringify(text)}}` : text;
}

/**
 * Writes one element and its children, one element per line, two-space indented.
 *
 * @param node - The element.
 * @param texts - The text of each slot.
 * @param syntax - HTML or JSX.
 * @param depth - The indent level.
 * @returns The lines.
 */
function renderNode(
  node: MarkupNode,
  texts: (slot: string) => string,
  syntax: Syntax,
  depth: number,
): string[] {
  const pad = "  ".repeat(depth);
  const slot = node.slot ? ` data-veilo-slot="${node.slot}"` : "";
  if (node.tag === "img") {
    // The alt text is empty: the slot's `photo` is a placeholder the user replaces.
    return [`${pad}<img${slot} src="photo.jpg" alt=""${syntax === "jsx" ? " /" : ""}>`];
  }
  if (node.children) {
    return [
      `${pad}<${node.tag}${slot}>`,
      ...node.children.flatMap((child) => renderNode(child, texts, syntax, depth + 1)),
      `${pad}</${node.tag}>`,
    ];
  }
  return [`${pad}<${node.tag}${slot}>${content(texts(node.text ?? ""), syntax)}</${node.tag}>`];
}

/**
 * The card's inner markup: its parts with `data-veilo-slot` names and the user's text.
 *
 * @param input - The layout and text.
 * @param syntax - `html` or `jsx` (self-closing `img`, braces in text escaped).
 * @param depth - How many levels to indent the lines.
 * @returns The lines, without a container.
 */
function innerMarkup(input: SnippetInput, syntax: Syntax, depth: number): string[] {
  const layout = CARD_LAYOUTS[input.layoutId];
  const texts = (slot: string) => input.texts?.[slot] ?? defaultText(layout, slot);
  return MARKUP[input.layoutId].flatMap((node) => renderNode(node, texts, syntax, depth));
}

/**
 * The layout object a snippet passes to core: the settings and the layout's slot table.
 *
 * @param input - The layout and settings.
 * @returns The layout, ready to stringify.
 */
function layoutObject(
  input: SnippetInput,
): Omit<Layout, "settings"> & { settings: Partial<Settings> } {
  return {
    version: 1,
    settings: input.settings,
    slots: CARD_LAYOUTS[input.layoutId].slots,
  };
}

/**
 * Indents every line of a block except the first by a number of levels.
 *
 * @param text - The block.
 * @param depth - The indent level, two spaces each.
 * @returns The block, with its later lines indented.
 */
function indentAfterFirst(text: string, depth: number): string {
  return text.split("\n").join(`\n${"  ".repeat(depth)}`);
}

/**
 * Which settings differ from the defaults.
 *
 * @param settings - The current settings.
 * @param defaults - The default settings.
 * @returns Only the keys whose value differs, in the settings' own order.
 */
export function changedSettings(settings: Settings, defaults: Settings): Partial<Settings> {
  const changes: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(settings)) {
    if (value !== (defaults as unknown as Record<string, unknown>)[key]) changes[key] = value;
  }
  return changes as Partial<Settings>;
}

/**
 * The card width as a CSS length for the snippet.
 *
 * @param input - The layout and width.
 * @returns The width in px.
 */
function widthOf(input: SnippetInput): number {
  return input.width ?? CARD_LAYOUTS[input.layoutId].width;
}

/**
 * The layout JSON: settings, slot roles and bar widths. Pass it to `createReveal`, or to the
 * `layout` prop or attribute of the React component and the web component.
 *
 * @param input - The layout and settings.
 * @returns Two-space indented JSON.
 */
export function layoutJson(input: SnippetInput): string {
  return JSON.stringify(layoutObject(input), null, 2);
}

/**
 * Plain JavaScript: the markup and a `createReveal` call.
 *
 * @param input - The layout, text, width and settings.
 * @returns The HTML and script text.
 */
export function vanillaSnippet(input: SnippetInput): string {
  return [
    `<article class="card" style="width: ${widthOf(input)}px">`,
    ...innerMarkup(input, "html", 1),
    "</article>",
    "",
    '<script type="module">',
    '  import { createReveal } from "@veilo/core";',
    "",
    `  const layout = ${indentAfterFirst(layoutJson(input), 1)};`,
    "",
    '  const card = document.querySelector(".card");',
    "  const reveal = createReveal(card, layout);",
    "  // The skeleton shows for a moment, then the reveal plays.",
    "  reveal.playSequence();",
    "</script>",
  ].join("\n");
}

/**
 * A React component: the markup inside `Reveal`, with the layout as a prop.
 *
 * @param input - The layout, text, width and settings.
 * @returns The TSX text.
 */
export function reactSnippet(input: SnippetInput): string {
  return [
    'import { Reveal, type RevealProps } from "@veilo/react";',
    "",
    `const layout: RevealProps["layout"] = ${layoutJson(input)};`,
    "",
    "// `ready` is false while your data loads: the skeleton shows. When it turns true, the",
    "// reveal plays.",
    "export function Card({ ready }: { ready: boolean }) {",
    "  return (",
    `    <Reveal as="article" className="card" style={{ width: ${widthOf(input)} }} ready={ready} layout={layout}>`,
    ...innerMarkup(input, "jsx", 3),
    "    </Reveal>",
    "  );",
    "}",
  ].join("\n");
}

/**
 * The `<veilo-reveal>` element with its layout as an attribute.
 *
 * @param input - The layout, text, width and settings.
 * @returns The element's lines.
 */
function elementMarkup(input: SnippetInput): string[] {
  // Single quotes around the attribute, so the JSON's double quotes stay as they are.
  const attribute = layoutJson(input).replace(/&/g, "&amp;").replace(/'/g, "&#39;");
  return [
    `<veilo-reveal class="card" style="display: block; width: ${widthOf(input)}px" loading`,
    `  layout='${indentAfterFirst(attribute, 1)}'>`,
    ...innerMarkup(input, "html", 1),
    "</veilo-reveal>",
  ];
}

/**
 * The script that ends loading, which plays the reveal.
 *
 * @param lead - Extra lines at the top of the script, such as an import.
 * @returns The script's lines.
 */
function loadingScript(lead: string[]): string[] {
  return [
    '<script type="module">',
    ...lead.map((line) => (line === "" ? "" : `  ${line}`)),
    '  const card = document.querySelector("veilo-reveal");',
    "  // Remove `loading` when your data is ready and the reveal plays. A timer stands in for",
    "  // the data here.",
    "  setTimeout(() => {",
    "    card.loading = false;",
    "  }, 1000);",
    "</script>",
  ];
}

/**
 * The web component, registered from the npm package.
 *
 * @param input - The layout, text, width and settings.
 * @returns The HTML and script text.
 */
export function elementSnippet(input: SnippetInput): string {
  return [
    ...elementMarkup(input),
    "",
    ...loadingScript(['import "@veilo/element/define";', ""]),
  ].join("\n");
}

/**
 * The web component from a CDN: one script tag, no build step.
 *
 * @param input - The layout, text, width and settings.
 * @returns The HTML text.
 */
export function cdnSnippet(input: SnippetInput): string {
  return [
    '<script type="module" src="https://cdn.jsdelivr.net/npm/@veilo/element"></script>',
    "",
    ...elementMarkup(input),
    "",
    ...loadingScript([]),
  ].join("\n");
}
