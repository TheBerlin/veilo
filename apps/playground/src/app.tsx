// app.tsx: the playground's root component. A shell for now; the stage and tabs come next.

import styles from "./app.module.css";

/**
 * The playground page.
 *
 * @returns The app shell.
 */
export function App() {
  return (
    <main className={styles.app}>
      <h1 className={styles.title}>Veilo playground</h1>
    </main>
  );
}
