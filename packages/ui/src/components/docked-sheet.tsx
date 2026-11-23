// docked-sheet.tsx: a panel docked to the bottom of the screen that holds a tool next to the thing it
// changes (a phone's settings, over the lower half of the preview). It is not a dialog: nothing is
// dimmed, locked or hidden from assistive technology, and the page above it stays usable.

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "./button.tsx";
import styles from "./docked-sheet.module.css";

/** Props of {@link DockedSheet}. */
export interface DockedSheetProps {
  /** Whether the sheet is up. */
  open: boolean;
  /** Called with `false` when the visitor closes it (the Close button or Escape). */
  onOpenChange: (open: boolean) => void;
  /** The sheet's title: its heading and its accessible name. */
  title: string;
  /** How much of the screen's height the sheet covers when it is up, as a fraction. Defaults to 0.5. */
  height?: number;
  /** The content, which scrolls inside the sheet. */
  children: ReactNode;
}

/**
 * A bottom sheet for a tool. When it opens, focus moves to its Close button; Escape or Close
 * brings it down and gives focus back to what opened it. While it is down it is hidden from
 * keyboard and screen readers. Unlike a modal drawer it never dims or inerts the page: the
 * preview above stays visible and in the tab order, so a control in the sheet and the effect it
 * changes can be used together. It slides with the duration tokens (so not at all under reduced
 * motion).
 *
 * Side effects: moves focus on open and close.
 *
 * @param props - The open state and its change handler, the title, the height and the content.
 * @returns The sheet, always in the page, up or down.
 */
export function DockedSheet(props: DockedSheetProps) {
  const { open, onOpenChange, title, height = 0.5, children } = props;
  const sheet = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  // What had focus when the sheet came up, to give it back when it goes down.
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (open) {
      opener.current = document.activeElement;
      close.current?.focus();
    } else if (
      opener.current instanceof HTMLElement &&
      // Only when focus was inside the sheet: if the visitor moved on, leave it where it is.
      (sheet.current?.contains(document.activeElement) || document.activeElement === document.body)
    ) {
      opener.current.focus();
    }
    // The opener is read on open only; this effect follows the open state.
  }, [open]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onOpenChange(false);
    }
  };

  return (
    <section
      ref={sheet}
      className={styles.sheet}
      data-open={open || undefined}
      aria-label={title}
      style={{ "--sheet-height": `${height * 100}dvh` } as React.CSSProperties}
      onKeyDown={onKeyDown}
    >
      <div className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        <Button ref={close} size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
