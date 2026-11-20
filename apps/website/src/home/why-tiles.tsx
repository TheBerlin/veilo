// why-tiles.tsx: the four tiles of "Why it's useful": their copy and a small live demo each. Every
// claim is true of the code today (see the notes on each demo); the demos are the real engine and
// the real @veilo-ui/css classes, not pictures.

import "@veilo-ui/css/skeleton.css";
import type { CSSProperties, ReactNode } from "react";
import { ShiftDemo } from "./shift-demo.tsx";
import { FrameworkDemo } from "./framework-demo.tsx";
import styles from "./why-tiles.module.css";

/** One tile: what it says and what it shows. */
export interface WhyTile {
  /** Stable id, used as a key and in tests. */
  id: string;
  /** The bold title. */
  title: string;
  /** The one-line caption under it. */
  caption: string;
  /** Whether the tile is a wide one (8 columns) or a narrow one (4), on a desktop screen. */
  wide: boolean;
  /** Whether the demo can be operated. Its frame is then exposed to assistive technology. */
  interactive?: boolean;
  /** Builds the live demo. `active` turns true once the tile has been scrolled into view. */
  demo: (props: DemoProps) => ReactNode;
}

/** Props of a demo that plays when its tile is in view. */
export interface DemoProps {
  /** True once the tile has been scrolled into view. */
  active: boolean;
}

/** The animation class of each way a skeleton item can behave in the small demos. */
const EFFECT_CLASS = {
  shimmer: "veilo-shimmer",
  wave: "veilo-wave",
  pulse: "veilo-pulse",
  still: "",
} as const;

/** Props of {@link SkeletonItem}. */
interface SkeletonItemProps {
  /** How it moves: one of the three loaders of the CSS package, or `still` for none. */
  effect: keyof typeof EFFECT_CLASS;
}

/**
 * A small placeholder: an avatar and two lines of text, made of the CSS package's classes on plain
 * spans. The three parts carry `--i` 0, 1 and 2, which the wave reads to start each one a little
 * after the last. The same item is in both skeleton tiles, so they share one look.
 *
 * @param props - How it moves.
 * @returns The placeholder, hidden from assistive technology.
 */
function SkeletonItem(props: SkeletonItemProps) {
  const className = `veilo ${EFFECT_CLASS[props.effect]}`;
  const part = (index: number, extra: string) => (
    <span className={`${className} ${extra}`} style={{ "--i": index } as CSSProperties} />
  );
  return (
    <div className={styles.item} aria-hidden="true">
      {part(0, styles.avatar!)}
      <div className={styles.lines}>
        {part(1, styles.bar!)}
        {part(2, `${styles.bar} ${styles.short}`)}
      </div>
    </div>
  );
}

/**
 * CSS-only loaders: the stylesheet line, then the three classes of the CSS package, each on the
 * same small placeholder, labeled with the class name. No script runs in this demo; the animation
 * is the stylesheet's.
 *
 * @returns The demo.
 */
function CssOnlyDemo() {
  const effects = ["shimmer", "wave", "pulse"] as const;
  return (
    <div className={styles.rows}>
      <code className={styles.label}>{'@import "@veilo-ui/css/skeleton.css";'}</code>
      {effects.map((effect) => (
        <div key={effect} className={styles.row}>
          <code className={styles.label}>{`class="veilo veilo-${effect}"`}</code>
          <SkeletonItem effect={effect} />
        </div>
      ))}
    </div>
  );
}

/**
 * Reduced motion: the same placeholder moving and at rest, and the media query that stills it,
 * which is built into the stylesheet. For a visitor who asks for less motion, both rest.
 *
 * @returns The demo.
 */
function ReducedMotionDemo() {
  return (
    <div className={styles.rows}>
      <div className={styles.row}>
        <span className={styles.label}>Motion on</span>
        <SkeletonItem effect="shimmer" />
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Reduced motion</span>
        <SkeletonItem effect="still" />
      </div>
      <code className={styles.label}>@media (prefers-reduced-motion: reduce)</code>
    </div>
  );
}

/** The tiles, in reading order. */
export const WHY_TILES: readonly WhyTile[] = [
  {
    id: "layout",
    wide: true,
    interactive: true,
    title: "Layout stays put.",
    caption: "Placeholders keep the content's size.",
    demo: (props) => <ShiftDemo active={props.active} />,
  },
  {
    id: "css",
    wide: false,
    title: "CSS-only loaders.",
    caption: "No JavaScript needed to shimmer.",
    demo: () => <CssOnlyDemo />,
  },
  {
    id: "framework",
    wide: true,
    interactive: true,
    title: "Your framework.",
    caption: "React, Vue, Svelte, Angular or HTML.",
    demo: () => <FrameworkDemo />,
  },
  {
    id: "motion",
    wide: false,
    title: "Reduced motion.",
    caption: "Effects calm down when users ask.",
    demo: () => <ReducedMotionDemo />,
  },
];
