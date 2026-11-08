// dot-grid-background.tsx: React wrapper that shows the animated dot grid behind the page.

import { useEffect, useRef } from "react";
import { createDotGrid, type DotGridOptions } from "../dot-grid/dot-grid.ts";
import styles from "./dot-grid-background.module.css";

/** Props of {@link DotGridBackground}. */
export interface DotGridBackgroundProps {
  /** Grid settings, read once at mount. */
  options?: DotGridOptions;
}

/**
 * A fixed, decorative (`aria-hidden`) dot-grid canvas behind the page. Dots use
 * `--veilo-text`, so they follow the theme; a theme change (`data-theme` or the system
 * preference) redraws the frame at once. Under reduced motion it draws one still frame.
 * Side effects: listeners on the two media queries and an observer on `data-theme`,
 * removed on unmount with the grid.
 *
 * @param props - See {@link DotGridBackgroundProps}.
 * @returns The canvas.
 */
export function DotGridBackground(props: DotGridBackgroundProps) {
  const { options } = props;
  const ref = useRef<HTMLCanvasElement>(null);
  // Options are read once at mount, like the stage's reveal.
  const initial = useRef(options);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    const grid = createDotGrid(canvas, { ...initial.current, still: motion.matches });
    const onMotion = () => grid.update({ still: motion.matches });
    const onTheme = () => grid.redraw();
    const themeObserver = new MutationObserver(onTheme);
    themeObserver.observe(document.documentElement, { attributeFilter: ["data-theme"] });
    motion.addEventListener("change", onMotion);
    scheme.addEventListener("change", onTheme);
    return () => {
      motion.removeEventListener("change", onMotion);
      scheme.removeEventListener("change", onTheme);
      themeObserver.disconnect();
      grid.destroy();
    };
  }, []);
  return <canvas ref={ref} className={styles.background} aria-hidden="true" />;
}
