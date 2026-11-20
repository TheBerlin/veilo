// why-tiles.tsx: the four tiles of "Why it's useful": their copy and a small live demo each. Every
// claim is true of the code today (see the notes on each demo); the demos are the real engine and
// the real @veilo-ui/css classes, not pictures.

import type { Settings } from "@veilo-ui/core";
import type { LayoutInput } from "@veilo-ui/presets";
import "@veilo-ui/css/skeleton.css";
import type { CSSProperties, ReactNode } from "react";
import { useLoopingReveal } from "./use-looping-reveal.ts";
import styles from "./why-tiles.module.css";

/** One tile: what it says and what it shows. */
export interface WhyTile {
  /** Stable id, used as a key and in tests. */
  id: string;
  /** The bold title. */
  title: string;
  /** The one-line caption under it. */
  caption: string;
  /** Builds the live demo. `active` turns true once the tile has been scrolled into view. */
  demo: (props: DemoProps) => ReactNode;
}

/** Props of a demo that plays when its tile is in view. */
export interface DemoProps {
  /** True once the tile has been scrolled into view. */
  active: boolean;
}

/** Settings shared by the looping demos: a plain shimmer, then a quick fade. */
const LOOP_SETTINGS: Partial<Settings> = {
  version: 1,
  effect: "shimmer",
  lDur: 1.2,
  imageFx: "crossfade",
  textFx: "fade",
  rDur: 0.8,
};

/** Slot hints of the layout-stays-put card. */
const CARD_LAYOUT = {
  version: 1,
  slots: {
    pic: { role: "block" },
    first: { role: "text", width: 80 },
    second: { role: "text", width: 55 },
  },
} as const;

/**
 * Layout stays put: a small card goes from skeleton to content inside a dashed outline. The
 * outline is the card's box before anything loads; it never changes, because the overlays core
 * draws are absolutely positioned and never resize the element.
 *
 * @param props - Whether the tile is active.
 * @returns The demo.
 */
function StayPutDemo(props: DemoProps) {
  const ref = useLoopingReveal(LOOP_SETTINGS, CARD_LAYOUT, props.active);
  return (
    <div className={styles.outline}>
      <div ref={ref} className={styles.miniCard}>
        <div className={styles.pic} data-veilo-slot="pic" />
        <p className={styles.line} data-veilo-slot="first">
          Weekend in the mountains
        </p>
        <p className={styles.line} data-veilo-slot="second">
          Three days, two trails
        </p>
      </div>
    </div>
  );
}

/**
 * CSS-only loaders: the three classes of the CSS package on plain elements. No script runs in this
 * demo; the animation is the stylesheet's.
 *
 * @returns The demo.
 */
function CssOnlyDemo() {
  const rows = [
    { name: "shimmer", className: "veilo veilo-shimmer" },
    { name: "wave", className: "veilo veilo-wave" },
    { name: "pulse", className: "veilo veilo-pulse" },
  ];
  return (
    <div className={styles.rows}>
      {rows.map((row) => (
        <div key={row.name} className={styles.row}>
          <code className={styles.label}>{`.veilo-${row.name}`}</code>
          <div className={styles.bars} aria-hidden="true">
            {[0, 1].map((index) => (
              <span
                key={index}
                className={`${row.className} ${styles.bar}`}
                style={{ "--i": index } as CSSProperties}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** The six ways to use Veilo that exist as packages today. */
const FRAMEWORKS = ["React", "Vue", "Svelte", "Angular", "Web components", "Plain HTML"] as const;

/** Slot hints of the framework list: six short texts. */
const FRAMEWORK_LAYOUT: LayoutInput = {
  version: 1,
  slots: Object.fromEntries(FRAMEWORKS.map((_, index) => [`f${index}`, { role: "text" as const }])),
};

/**
 * Your framework: the six ways in, revealed one after another with the text effect.
 *
 * @param props - Whether the tile is active.
 * @returns The demo.
 */
function FrameworkDemo(props: DemoProps) {
  const ref = useLoopingReveal(
    { ...LOOP_SETTINGS, textFx: "scramble", charset: "binary", rDur: 1.2 },
    FRAMEWORK_LAYOUT,
    props.active,
  );
  return (
    <ul ref={ref as never} className={styles.chips}>
      {FRAMEWORKS.map((name, index) => (
        <li key={name} className={styles.chip} data-veilo-slot={`f${index}`}>
          {name}
        </li>
      ))}
    </ul>
  );
}

/**
 * Reduced motion: the same bar moving and at rest. The stylesheet stops its animations for a
 * visitor who asks for less motion, so for them both bars rest.
 *
 * @returns The demo.
 */
function ReducedMotionDemo() {
  return (
    <div className={styles.rows}>
      <div className={styles.row}>
        <span className={styles.label}>Motion on</span>
        <div className={styles.bars} aria-hidden="true">
          <span className={`veilo veilo-shimmer ${styles.bar} ${styles.wide}`} />
        </div>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Reduced motion</span>
        <div className={styles.bars} aria-hidden="true">
          <span className={`veilo ${styles.bar} ${styles.wide}`} />
        </div>
      </div>
    </div>
  );
}

/** The tiles, in reading order. */
export const WHY_TILES: readonly WhyTile[] = [
  {
    id: "layout",
    title: "Layout stays put.",
    caption: "Placeholders keep the content's size.",
    demo: (props) => <StayPutDemo active={props.active} />,
  },
  {
    id: "css",
    title: "CSS-only loaders.",
    caption: "No JavaScript needed to shimmer.",
    demo: () => <CssOnlyDemo />,
  },
  {
    id: "framework",
    title: "Your framework.",
    caption: "React, Vue, Svelte, Angular or HTML.",
    demo: (props) => <FrameworkDemo active={props.active} />,
  },
  {
    id: "motion",
    title: "Reduced motion.",
    caption: "Effects calm down when users ask.",
    demo: () => <ReducedMotionDemo />,
  },
];
