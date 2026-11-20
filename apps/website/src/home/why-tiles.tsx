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
