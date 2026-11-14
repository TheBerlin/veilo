// baselines.ts: the one list of screenshot baselines the specs take, per spec file and theme
// project. The specs name their screenshots from here, and baselines.spec.ts fails when a file in
// __screenshots__ is missing from this list (an orphan left by a renamed or removed preset) or the
// list names a file that does not exist.

import { PRESETS } from "@veilo/presets";

/** The theme projects in playwright.config.ts. */
export const THEMES = ["dark", "light"] as const;

/** The progress values the frame screenshots lock. */
export const PROGRESS = [0, 0.25, 0.5, 0.75, 1] as const;

/**
 * The file name of a frame screenshot: `p050` rather than `0.5`, so files sort by progress.
 *
 * @param presetId - The preset's id.
 * @param p - The progress, or `loading` for the Loading view.
 * @returns The file name, such as `dot-upscale-p050.png`.
 */
export function frameName(presetId: string, p: number | "loading"): string {
  const suffix = p === "loading" ? "loading" : `p${String(Math.round(p * 100)).padStart(3, "0")}`;
  return `${presetId}-${suffix}.png`;
}

/** The screenshot taken by reduced-motion.spec.ts, in the dark project only. */
export const CSS_DEMO_NAME = "css-demo.png";

/**
 * Every baseline the suite expects, as paths relative to `e2e/__screenshots__`.
 *
 * @returns The paths with forward slashes, sorted.
 */
export function expectedBaselines(): string[] {
  const paths: string[] = [];
  for (const theme of THEMES) {
    for (const preset of PRESETS) {
      for (const p of [...PROGRESS, "loading" as const]) {
        paths.push(`frames.spec.ts/${theme}/${frameName(preset.id, p)}`);
      }
    }
  }
  paths.push(`reduced-motion.spec.ts/dark/${CSS_DEMO_NAME}`);
  return paths.sort();
}
