// app.tsx: the playground's root component. Owns the one settings store.

import { presetSettings } from "@veilo/presets";
import { DotGridBackground, TooltipProvider } from "@veilo/ui";
import { useState } from "react";
import styles from "./app.module.css";
import { PresetChips } from "./header/preset-chips.tsx";
import { Panel } from "./panel/panel.tsx";
import { parseFrameQuery } from "./stage/frame-query.ts";
import { Stage } from "./stage/stage.tsx";
import { ThemeSwitch } from "./theme/theme-switch.tsx";
import { createSettingsStore } from "./state/settings-store.ts";

/**
 * The playground page. A `?preset=<id>&p=<0..1>` query opens it on that preset, paused at that
 * progress (used by the visual tests).
 *
 * @returns The app.
 */
export function App() {
  // The URL is read once, at mount.
  const [frame] = useState(() => parseFrameQuery(window.location.search));
  // One store for the app's lifetime; useState's initializer runs once.
  const [store] = useState(() =>
    createSettingsStore(frame ? presetSettings(frame.preset) : undefined),
  );
  return (
    <TooltipProvider delayDuration={200}>
      <main className={styles.app}>
        {/* Decorative animated background behind the whole page. */}
        <DotGridBackground />
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Veilo playground</h1>
            <ThemeSwitch />
          </div>
          <p className={styles.description}>
            Design skeleton loaders and image and text reveals, then export the settings or the CSS.
          </p>
          <PresetChips store={store} />
        </header>
        <div className={styles.workspace}>
          {/* Sticky on wide screens, so the preview stays in view while the panel scrolls. */}
          <div className={styles.stageColumn}>
            <Stage store={store} frame={frame?.p} />
          </div>
          <Panel store={store} />
        </div>
      </main>
    </TooltipProvider>
  );
}
