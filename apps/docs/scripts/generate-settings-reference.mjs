// generate-settings-reference.mjs: writes src/content/docs/reference/settings.mdx from core's settings
// JSON Schema, so the ranges, options and defaults on the page are the ones core enforces and can
// never drift. The words (what each key does, and when it matters) are written here, once per key.
// The build fails when the schema has a key without words here, or this file describes a key the
// schema no longer has, so a new or removed setting cannot go undocumented.
//
// The generated page is not committed (it is in .gitignore); `pnpm dev` and `pnpm build` make it.

import { settingsJsonSchema } from "@veilo-ui/core/loader";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The groups of the page, in order, with the introduction under each heading. */
const GROUPS = [
  {
    title: "Loader",
    intro: "The skeleton placeholder shown while content loads.",
    keys: {
      effect: [
        "Loader style. `shimmer`: a highlight band travels across each placeholder. `wave`: the same sweep, starting later on each element. `pulse`: the placeholder fades between full opacity and `depth`.",
        "always",
      ],
      lDur: ["Duration of one pass, in seconds.", "always"],
      lGap: ["Pause between passes, in seconds.", "effect is not `pulse`"],
      lEase: [
        "Easing of each pass. With `custom`, the curve comes from `lx1`, `ly1`, `lx2` and `ly2`.",
        "always",
      ],
      lx1: [
        "Custom curve, first control point x. A CSS `cubic-bezier()` point.",
        "`lEase` is `custom`",
      ],
      ly1: ["Custom curve, first control point y.", "`lEase` is `custom`"],
      lx2: ["Custom curve, second control point x.", "`lEase` is `custom`"],
      ly2: ["Custom curve, second control point y.", "`lEase` is `custom`"],
      repeat: ["Whether the animation repeats (`loop`) or plays one pass (`once`).", "always"],
      stagger: [
        "Delay added per element, in seconds: element number *n* starts *n* × `stagger` later.",
        "effect is `wave`",
      ],
      angle: ["Angle of the sweep, in degrees.", "effect is not `pulse`"],
      lWidth: [
        "Width of the highlight band, in percent of the placeholder.",
        "effect is not `pulse`",
      ],
      depth: ["Lowest opacity of the pulse.", "effect is `pulse`"],
      radius: ["Corner radius of the placeholder bars, in pixels.", "always"],
    },
  },
  {
    title: "Image",
    intro: "How the photo is revealed. The grid effects are `dots`, `hex`, `binary` and `mosaic`.",
    keys: {
      imageFx: [
        "Image reveal. `dots`, `hex` and `binary` draw a grid over the photo (dots sized by darkness, or characters from IBM Plex Mono); `mosaic` draws squares in the photo's own colors; `blur` sharpens from a blur while fading in; `crossfade` fades the photo in; `wipe` uncovers it from the `origin`; `zoom` settles it from a larger size while fading in.",
        "always",
      ],
      origin: [
        "Where the reveal starts. With `random`, `wipe` falls back to a fade.",
        "a grid effect, or `wipe`",
      ],
      cols: ["Number of grid columns. The rows follow from the image's shape.", "a grid effect"],
      startScale: [
        "How large each cell is when it first appears, as a multiple of its final size.",
        "a grid effect",
      ],
      spread: [
        "How far apart the cells start. Higher values start the cells further apart in time, and each then animates for less.",
        "a grid effect",
      ],
    },
  },
  {
    title: "Text",
    intro: "How text is revealed.",
    keys: {
      textFx: [
        "Text reveal. `scramble`: random characters resolve into the text. `typewriter`: the text is typed with a caret. `rise`: the text fades in while moving up and sharpening. `fade`: the text fades in.",
        "always",
      ],
      charset: ["Characters used while scrambling.", "`textFx` is `scramble`"],
      unit: [
        "Whether scrambled text resolves one character (`char`) or one word (`word`) at a time.",
        "`textFx` is `scramble`",
      ],
    },
  },
  {
    title: "Timing",
    intro: "How long the reveal takes and how long the skeleton shows first.",
    keys: {
      rDur: ["Duration of the reveal, in seconds.", "always"],
      rEase: [
        "Easing of the reveal. With `custom`, the curve comes from `rx1`, `ry1`, `rx2` and `ry2`.",
        "always",
      ],
      rx1: ["Custom curve, first control point x.", "`rEase` is `custom`"],
      ry1: ["Custom curve, first control point y.", "`rEase` is `custom`"],
      rx2: ["Custom curve, second control point x.", "`rEase` is `custom`"],
      ry2: ["Custom curve, second control point y.", "`rEase` is `custom`"],
      hold: ["How long the skeleton shows before the reveal in a sequence, in seconds.", "always"],
    },
  },
  {
    title: "Colors",
    intro: "Optional overrides, as `#rrggbb`. Without them the colors come from the page.",
    keys: {
      baseColor: ["Skeleton base color. Otherwise `--veilo-base`.", "optional"],
      highlightColor: ["Skeleton highlight color. Otherwise `--veilo-hi`.", "optional"],
      inkColor: [
        "Color of the dots and characters of the grid effects. Otherwise `--veilo-ink`, then the text color.",
        "optional",
      ],
    },
  },
];

const schema = settingsJsonSchema();
const properties = schema.properties;
const described = new Set(GROUPS.flatMap((group) => Object.keys(group.keys)));
// `version` is not a tunable setting: the page explains it in its introduction.
const known = new Set(Object.keys(properties).filter((key) => key !== "version"));

const missing = [...known].filter((key) => !described.has(key));
const stale = [...described].filter((key) => !known.has(key));
if (missing.length > 0 || stale.length > 0) {
  console.error(
    "The settings reference is out of step with core's settings.\n" +
      (missing.length ? `  Not described: ${missing.join(", ")}\n` : "") +
      (stale.length ? `  No longer in the schema: ${stale.join(", ")}\n` : "") +
      "Edit scripts/generate-settings-reference.mjs.",
  );
  process.exit(1);
}

/**
 * Describes a key's allowed values from its schema.
 *
 * @param entry - The schema property.
 * @returns Markdown for the "Values" column.
 */
function valuesOf(entry) {
  if (entry.enum) return entry.enum.map((value) => `\`${value}\``).join(", ");
  if (entry.pattern) return "`#rrggbb`";
  return `${entry.minimum} to ${entry.maximum}`;
}

/**
 * Describes a key's default.
 *
 * @param entry - The schema property.
 * @returns Markdown for the "Default" column.
 */
const defaultOf = (entry) => (entry.default === undefined ? "none" : `\`${entry.default}\``);

const lines = [
  "---",
  "title: Settings reference",
  "description: Every Veilo setting with its values, default and what it does, generated from the same schema the engine checks against.",
  "---",
  "",
  "{/* Generated by scripts/generate-settings-reference.mjs from core's settings schema. Do not edit. */}",
  "",
  `An effect is one flat object of plain JSON. Every key is optional: a missing key takes its default, an unknown key is ignored, a value of the wrong type falls back to the default, and a number outside its range is clamped. The object carries a \`version\` field (now \`${properties.version.const}\`). A change that renames a key, removes one or changes what it means raises the version.`,
  "",
  "The same data is published as a JSON Schema, `@veilo-ui/core/settings.schema.json`.",
  "",
];
for (const group of GROUPS) {
  lines.push(`## ${group.title}`, "", group.intro, "");
  lines.push(
    "| Key | What it does | Values | Default | Used when |",
    "| --- | --- | --- | --- | --- |",
  );
  for (const [key, [words, when]] of Object.entries(group.keys)) {
    const entry = properties[key];
    lines.push(`| \`${key}\` | ${words} | ${valuesOf(entry)} | ${defaultOf(entry)} | ${when} |`);
  }
  lines.push("");
}

const out = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "content",
  "docs",
  "reference",
);
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "settings.mdx"), lines.join("\n"));
console.log(`Wrote reference/settings.mdx (${known.size} settings).`);
