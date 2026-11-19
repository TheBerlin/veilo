// app.tsx: the playground's root component. Owns the one settings store and decides what it
// starts with, and lays out the app: a top bar, the stage and the panel beside it, or on a phone
// the stage with a bottom row and the panel in a sheet.

import { presetSettings } from "@veilo-ui/presets";
import { Button, DockedSheet, Toaster, TooltipProvider } from "@veilo-ui/ui";
import { useEffect, useState } from "react";
import styles from "./app.module.css";
import { ExportButton } from "./header/export-drawer.tsx";
import { MyPresetsMenu } from "./header/my-presets-menu.tsx";
import { PresetChips } from "./header/preset-chips.tsx";
import { ResetButton } from "./header/reset-button.tsx";
import { Panel } from "./panel/panel.tsx";
import { browserStorage } from "./presets/browser-storage.ts";
import { readLastSession, watchLastSession } from "./presets/last-session.ts";
import { createUserPresetsStore } from "./presets/user-presets-store.ts";
import { ShareNotice } from "./share/share-notice.tsx";
import { parseFrameQuery } from "./stage/frame-query.ts";
import { Stage } from "./stage/stage.tsx";
import { createContentStore } from "./state/content-store.ts";
import { createSettingsStore } from "./state/settings-store.ts";
import { useNarrow } from "./state/use-narrow.ts";

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
  const [session] = useState(() => readLastSession(storage));
  const [store] = useState(() =>
    createSettingsStore(frame ? presetSettings(frame.preset) : session?.settings),
  );
  // The preview content (image ratio) starts from the session too; a frame request keeps the
  // defaults, which the visual baselines are made with.
  const [content] = useState(() => createContentStore(session?.content));
  useEffect(
    () => (storage ? watchLastSession(store, storage, { content }) : undefined),
    [store, content, storage],
  );
  // Saved presets: kept in the same storage, or in memory only when there is none.
  const [presets] = useState(() => createUserPresetsStore(storage));
  // A phone gets a different set of parts: a bottom row, and the settings in a sheet.
  const narrow = useNarrow();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const size = narrow ? "md" : "sm";
  const actions = (
    <>
      <MyPresetsMenu store={store} presets={presets} size={size} compact={narrow} />
      <ResetButton store={store} content={content} size={size} compact={narrow} />
      <ExportButton store={store} content={content} size={size} />
    </>
  );
  return (
    <TooltipProvider delayDuration={200}>
      <div className={styles.app}>
        <header className={styles.header}>
          <h1 className={styles.title}>Veilo playground</h1>
          <div className={styles.presets}>
            <PresetChips store={store} />
          </div>
          {narrow ? null : <div className={styles.actions}>{actions}</div>}
          {/* A frame request is for the visual tests and wins over a shared link. */}
          {frame ? null : <ShareNotice store={store} content={content} />}
        </header>
        <div className={styles.workspace}>
          {/* The stage takes the height left under the top bar; the panel scrolls on its own. */}
          <div className={styles.stageColumn}>
            <Stage store={store} content={content} frame={frame?.p} />
          </div>
          {narrow ? null : <Panel store={store} content={content} />}
        </div>
        {narrow ? (
          <>
            <div className={styles.dock}>
              <Button size="md" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(true)}>
                Settings
              </Button>
              {actions}
            </div>
            {/* Docked, not a modal: the card stays in view and in reach above the sheet while a slider
                moves, and nothing on the page is hidden from a screen reader. */}
            <DockedSheet
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
              title="Settings"
              height={0.55}
            >
              <div className={styles.sheet}>
                <Panel store={store} content={content} embedded />
              </div>
            </DockedSheet>
          </>
        ) : null}
      </div>
      {/* Messages (the reset with its Undo, a shared link) appear under the top bar. Outside the
          app's grid, so the toaster's own element is not one more row in it. */}
      <Toaster position="top-center" offset={narrow ? 164 : 136} />
    </TooltipProvider>
  );
}
