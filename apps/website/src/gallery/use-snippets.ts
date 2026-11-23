// use-snippets.ts: the code a visitor copies to put an effect in their own project: an install
// line and one snippet each for plain JavaScript, React and the web component. Pure text builders,
// so a test can check them against the real package.

import { usesFlakeShape, type EffectId, type FlakeShape } from "@veilo-ui/seasonal";

/** The ways to use an effect. */
export type UseFormat = "javascript" | "react" | "element";

/** The formats, in the order the tabs show them, with their labels. */
export const USE_FORMATS: readonly { id: UseFormat; label: string }[] = [
  { id: "javascript", label: "JavaScript" },
  { id: "react", label: "React" },
  { id: "element", label: "Web component" },
];

/** The install command. */
export const INSTALL_COMMAND = "npm install @veilo-ui/seasonal";

/**
 * The options a snippet passes besides the effect: the flake form, only when it is not the
 * default and the effect draws a flake.
 *
 * @param id - The effect.
 * @param shape - The flake form chosen on the page.
 * @returns The form, or undefined when it is not worth writing.
 */
function shapeOption(id: EffectId, shape: FlakeShape): FlakeShape | undefined {
  return usesFlakeShape(id) && shape !== "dendrite" ? shape : undefined;
}

/**
 * The snippet for one effect in one format.
 *
 * @param format - JavaScript, React or the web component.
 * @param id - The effect's id.
 * @param shape - The flake form chosen on the page.
 * @returns Ready-to-paste code.
 */
export function useSnippet(format: UseFormat, id: EffectId, shape: FlakeShape): string {
  const form = shapeOption(id, shape);
  if (format === "react") {
    return `import { SeasonalEffect } from "@veilo-ui/seasonal/react";

export function Loading() {
  // The effect fills its canvas, so give it a size.
  return (
    <SeasonalEffect name="${id}"${form ? ` shape="${form}"` : ""} style={{ width: 240, height: 240 }} />
  );
}`;
  }
  if (format === "element") {
    return `<script type="module">
  import { defineSeasonalEffect } from "@veilo-ui/seasonal/element";
  defineSeasonalEffect();
</script>

<!-- The effect fills the element, so give it a size. -->
<veilo-seasonal-effect name="${id}"${form ? ` shape="${form}"` : ""} style="width: 240px; height: 240px"></veilo-seasonal-effect>`;
  }
  return `import { mountEffect } from "@veilo-ui/seasonal";

// A container with a size: the effect fills it.
const container = document.querySelector("#loading");
const effect = mountEffect(container, "${id}"${form ? `, { shape: "${form}" }` : ""});

// When your content has arrived:
effect.destroy();`;
}
