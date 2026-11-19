// variants-page.tsx: a reference page for comparing alternative designs of one section, one under
// the other, each under a label bar. Served by the dev server at /variants.html; it is not part of
// the built site. It is empty for now: to compare designs again, add an entry to DESIGNS.

import { ThemeSwitch } from "@veilo-ui/ui";
import type { ReactNode } from "react";
import styles from "./variants-page.module.css";

/** One design on the page. */
interface Design {
  /** An id for the anchor. */
  id: string;
  /** The design's name, shown in its label bar and as a link. */
  name: string;
  /** One sentence on how it works. */
  note: string;
  /** Renders the design itself. */
  render: () => ReactNode;
}

/**
 * The designs on the page, in order. Empty for now. The earlier comparison of "How it works" is
 * gone from here: its winner is the home page's section (`../home/how-it-works.tsx`), and the
 * other two layouts are kept, unused, in `columns.tsx` and `stage.tsx` in this folder.
 */
const DESIGNS: readonly Design[] = [];

/** Props of {@link Labelled}. */
interface LabelledProps {
  /** The design to show. */
  design: Design;
}

/**
 * A design under a label bar that names it. The bar is for this page only; it is not part of the
 * design.
 *
 * @param props - The design.
 * @returns The labelled block.
 */
function Labelled(props: LabelledProps) {
  const { design } = props;
  return (
    <div id={design.id} className={styles.block}>
      <div className={styles.label}>
        <p className={styles.name}>{design.name}</p>
        <p className={styles.note}>{design.note}</p>
      </div>
      {design.render()}
    </div>
  );
}

/**
 * The page: a bar with the theme switch and links to the designs, then the designs, or a short
 * note when there are none.
 *
 * @returns The page.
 */
export function VariantsPage() {
  return (
    <>
      <header className={styles.bar}>
        <nav className={styles.links} aria-label="Designs">
          {DESIGNS.map((design) => (
            <a key={design.id} href={`#${design.id}`}>
              {design.name.split(".")[0]}
            </a>
          ))}
        </nav>
        <ThemeSwitch />
      </header>
      <main>
        {DESIGNS.length === 0 ? (
          <p className={styles.empty}>No designs to compare right now.</p>
        ) : (
          DESIGNS.map((design) => <Labelled key={design.id} design={design} />)
        )}
      </main>
    </>
  );
}
