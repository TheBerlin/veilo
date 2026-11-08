// app.tsx: the playground's root component. Owns the one settings store.

import { useState } from "react";
import styles from "./app.module.css";
import { PresetChips } from "./header/preset-chips.tsx";
import { Panel } from "./panel/panel.tsx";
import { Stage } from "./stage/stage.tsx";
import { createSettingsStore } from "./state/settings-store.ts";

/**
 * The playground page.
 *
 * @returns The app.
 */
export function App() {
  // One store for the app's lifetime; useState's initializer runs once.
  const [store] = useState(() => createSettingsStore());
  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Veilo playground</h1>
        <PresetChips store={store} />
      </header>
      <div className={styles.workspace}>
        <Stage store={store} />
        <Panel store={store} />
      </div>
    </main>
  );
}
