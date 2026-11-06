// app.tsx: the playground's root component. Owns the one settings store.

import { useState } from "react";
import styles from "./app.module.css";
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
      <h1 className={styles.title}>Veilo playground</h1>
      <Stage store={store} />
    </main>
  );
}
