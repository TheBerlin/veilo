// how-steps.tsx: the content of "How it works": three steps, each with its text, a link on and its
// live visual. One list, used by the section and by the design variants page.

import type { ReactNode } from "react";
import { PLAYGROUND_URL } from "../site/links.ts";
import { ExportVisual, PreviewVisual, TuneVisual } from "./how-visuals.tsx";
import styles from "./how-steps.module.css";

/** One step of the section. */
export interface StepContent {
  /** A stable id, for keys and tab values. */
  id: "tune" | "preview" | "export";
  /** The step's title, such as "Tune.". */
  title: string;
  /** A short label for tabs and lists, without the full stop. */
  label: string;
  /** The step's text. */
  text: ReactNode;
  /** The link that leads on from the step. */
  link: { href: string; label: string };
  /** The live visual: a component, so a variant mounts it only when it shows it. */
  Visual: () => ReactNode;
}

/** The three steps, in order. */
export const STEPS: readonly StepContent[] = [
  {
    id: "tune",
    title: "Tune.",
    label: "Tune",
    text: (
      <>
        Pick a preset or start from scratch. Move the sliders, edit the easing curve, and drop in
        your own image and text. Every change plays on the test card straight away.
      </>
    ),
    link: { href: PLAYGROUND_URL, label: "Open the playground" },
    Visual: TuneVisual,
  },
  {
    id: "preview",
    title: "Preview.",
    label: "Preview",
    text: (
      <>
        While your data loads, Veilo shows a skeleton. When it arrives, the reveal turns it into the
        real content. Drag the scrubber to go frame by frame: each frame is a pure function of
        progress, so what you see at 40% is exactly what ships.
      </>
    ),
    link: { href: PLAYGROUND_URL, label: "Scrub it in the playground" },
    Visual: PreviewVisual,
  },
  {
    id: "export",
    title: "Export.",
    label: "Export",
    text: (
      <>
        Copy the settings as JSON, plain CSS, or a snippet for React, Vue, Svelte, Angular, web
        components or plain HTML. Mark the parts of your markup with{" "}
        <code className={styles.code}>data-veilo-slot</code>, and the effect runs on your own
        elements without moving them.
      </>
    ),
    link: { href: PLAYGROUND_URL, label: "Export from the playground" },
    Visual: ExportVisual,
  },
];

/** The section's heading. */
export const SECTION_TITLE = "From a tuned effect to your own markup.";
