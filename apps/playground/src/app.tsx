// app.tsx: the playground's root component. Owns the one settings store and decides what it
// starts with.

import { presetSettings } from "@veilo/presets";
import { TooltipProvider } from "@veilo/ui";
import { useEffect, useState } from "react";
import styles from "./app.module.css";
import { PresetChips } from "./header/preset-chips.tsx";
import { Panel } from "./panel/panel.tsx";
import { browserStorage } from "./presets/browser-storage.ts";
import { readLastSession, watchLastSession } from "./presets/last-session.ts";
import { ShareNotice } from "./share/share-notice.tsx";
import { parseFrameQuery } from "./stage/frame-query.ts";
import { Stage } from "./stage/stage.tsx";
import { ThemeSwitch } from "./theme/theme-switch.tsx";
import { createSettingsStore } from "./state/settings-store.ts";

/**
 * The playground page. A `?preset=<id>&p=<0..1>` query opens it on that preset, paused at that
 * progress (used by the visual tests). Otherwise the page opens on the last session's settings
 * (saved in this browser) and then loads a `#v1.` share link fragment, if any. Side effects:
 * reads and writes localStorage, unless a frame is requested.
 *
 * @returns The app.
 */
export function App() {
  // The URL is read once, at mount.
  const [frame] = useState(() => parseFrameQuery(window.location.search));
  // A frame request leaves storage alone, so visual tests neither read nor write a session.
  const [storage] = useState(() => (frame ? null : browserStorage()));
  // One store for the app's lifetime; useState's initializer runs once. Starting order: a frame
  // request, else the last session, else the defaults. A share link loads after mount
  // (ShareNotice) and so wins over the last session.
  const [store] = useState(() =>
    createSettingsStore(
      frame ? presetSettings(frame.preset) : (readLastSession(storage) ?? undefined),
    ),
  );
  useEffect(() => (storage ? watchLastSession(store, storage) : undefined), [store, storage]);
  return (
    <TooltipProvider delayDuration={200}>
      <main className={styles.app}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Veilo playground</h1>
            <ThemeSwitch />
          </div>
          <p className={styles.description}>
            Design skeleton loaders and image and text reveals, then export the settings or the CSS.
          </p>
          <PresetChips store={store} />
          {/* A frame request is for the visual tests and wins over a shared link. */}
          {frame ? null : <ShareNotice store={store} className={styles.notice} />}
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
