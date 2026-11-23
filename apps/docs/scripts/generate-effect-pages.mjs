// generate-effect-pages.mjs: writes one page per built-in preset, and an index, into
// src/content/docs/effects/ from the presets package, so the table of what a preset sets is always
// the package's own data. The words for each preset are written here, once. The build fails when a
// preset has no words here or this file describes a preset that is gone.
//
// The generated pages are not committed (the folder is in .gitignore); `pnpm dev` and `pnpm build`
// make them.

import { defaultSettings } from "@veilo-ui/core/loader";
import { PRESETS } from "@veilo-ui/presets";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PLAYGROUND_URL } from "../src/site.mjs";

/** What each preset looks like and when to pick it, by id. */
const WORDS = {
  "dot-upscale": [
    "The default effect: a dot grid sharpens into the photo from the left while the text scrambles into place, character by character.",
    "A good starting point for almost any card. The dots read as a clear signal that content is arriving.",
  ],
  "hex-from-center": [
    "Hex characters grow outward from the center of the photo, and the text scrambles in hex, one word at a time.",
    "A technical look, for developer tools and dashboards. It needs IBM Plex Mono for the characters.",
  ],
  "matrix-columns": [
    "Binary digits sweep across the photo from the left, and the text scrambles in zeros and ones.",
    "The loudest of the set. Use it where the screen can carry some personality.",
  ],
  "cascade-wave": [
    "A wave loader, each placeholder starting a beat after the one above, then the photo wipes in from the left while the text rises and sharpens.",
    "A clean, quiet motion that suits content lists.",
  ],
  "soft-pulse": [
    "A slow pulse while loading, then the photo sharpens from a blur while the text fades in.",
    "The gentlest effect: no sweep and no characters, so it works for calm, content-first layouts.",
  ],
  "compact-shimmer": [
    "One shimmer pass, then a fast crossfade, with the text fading in. It is over in about 0.6 seconds.",
    "For dense screens and quick loads, where a longer reveal would get in the way.",
  ],
  "mosaic-from-edge": [
    "Colored tiles fill the photo from one corner to the other, and the text is typed with a caret.",
    "The tiles take the photo's own colors, so it also works as a stylized progressive load.",
  ],
};

const known = new Set(PRESETS.map((preset) => preset.id));
const missing = [...known].filter((id) => !(id in WORDS));
const stale = Object.keys(WORDS).filter((id) => !known.has(id));
if (missing.length > 0 || stale.length > 0) {
  console.error(
    "The effect pages are out of step with the presets package.\n" +
      (missing.length ? `  Not described: ${missing.join(", ")}\n` : "") +
      (stale.length ? `  No longer a preset: ${stale.join(", ")}\n` : "") +
      "Edit scripts/generate-effect-pages.mjs.",
  );
  process.exit(1);
}

const out = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "content",
  "docs",
  "effects",
);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

/**
 * Formats a setting value for a table cell.
 *
 * @param value - A setting value.
 * @returns Inline code.
 */
const code = (value) => `\`${value}\``;

for (const [position, preset] of PRESETS.entries()) {
  const [what, when] = WORDS[preset.id];
  const entries = Object.entries(preset.settings);
  const table =
    entries.length === 0
      ? "This preset sets nothing: it is the defaults."
      : [
          "| Setting | Value | Default |",
          "| --- | --- | --- |",
          ...entries.map(
            ([key, value]) => `| ${code(key)} | ${code(value)} | ${code(defaultSettings[key])} |`,
          ),
        ].join("\n");
  const json = JSON.stringify(preset.settings, null, 2);
  const page = `---
title: ${preset.name}
description: "${what.replaceAll('"', '\\"')}"
sidebar:
  order: ${position + 1}
---

import EffectPreview from "../../../components/EffectPreview.tsx";

${what}

<EffectPreview client:visible preset="${preset.id}" />

${when}

## What it sets

${table}

Everything not listed keeps its default. See the [settings reference](/reference/settings/) for what each key does.

## Use it

\`\`\`tsx
import { Reveal } from "@veilo-ui/react";

<Reveal ready={!loading} preset="${preset.id}">
  {/* your slots */}
</Reveal>;
\`\`\`

With the plain JavaScript engine, pass the settings:

\`\`\`ts
import { createReveal } from "@veilo-ui/core";

createReveal(card, ${json});
\`\`\`

[Open it in the playground](${PLAYGROUND_URL}?preset=${preset.id}) to change it and copy the code for your framework.
`;
  writeFileSync(join(out, `${preset.id}.mdx`), page);
}

const rows = PRESETS.map(
  (preset) => `- [${preset.name}](/effects/${preset.id}/): ${WORDS[preset.id][0]}`,
).join("\n");
writeFileSync(
  join(out, "index.mdx"),
  `---
title: Effects
description: "The ready-made effects: each is a preset you can use as it is or change."
sidebar:
  order: 0
---

A preset is a named set of settings. Each page shows the effect running on a sample card, what it sets, and the code to use it.

${rows}
`,
);
console.log(`Wrote ${PRESETS.length} effect pages and an index.`);
