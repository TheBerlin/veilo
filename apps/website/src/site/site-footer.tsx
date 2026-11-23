// site-footer.tsx: the site footer: the author, the page links and the license line.

import { AUTHOR_URL, GALLERY_URL, GITHUB_URL, PLAYGROUND_URL } from "./links.ts";
import styles from "./site-footer.module.css";

/**
 * The site footer, as the design system describes it: the author's name linking to their GitHub
 * profile, the navigation links and the license line. The side padding matches the header's.
 *
 * @returns The `<footer>` landmark.
 */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.author}>
          Made by <a href={AUTHOR_URL}>Bohdan Samishchenko</a>
        </p>
        <nav aria-label="Footer">
          <ul className={styles.links}>
            <li>
              <a href={PLAYGROUND_URL}>Playground</a>
            </li>
            <li>
              <a href={GALLERY_URL}>Gallery</a>
            </li>
            <li>
              <a href={GITHUB_URL}>GitHub</a>
            </li>
          </ul>
        </nav>
        <p className={styles.license}>MIT License</p>
      </div>
    </footer>
  );
}
