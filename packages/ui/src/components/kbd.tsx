// kbd.tsx: a keycap: a small boxed key name that shows a keyboard shortcut.

import type { HTMLAttributes } from "react";
import styles from "./kbd.module.css";

/** Props of {@link Kbd}: any `<kbd>` attribute. */
export type KbdProps = HTMLAttributes<HTMLElement>;

/**
 * A keycap for a keyboard shortcut, for example `R` on a Replay button. It only shows the hint;
 * the shortcut itself is the caller's to handle, and the caller names it for assistive
 * technology (for example with `aria-keyshortcuts` on the control).
 *
 * @param props - The key's name as children, and any `<kbd>` attribute.
 * @returns The `<kbd>` element.
 */
export function Kbd(props: KbdProps) {
  const { className, ...rest } = props;
  return <kbd className={[styles.kbd, className].filter(Boolean).join(" ")} {...rest} />;
}
