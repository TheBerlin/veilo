// drawer.tsx: a panel that slides in from the side or the bottom over the page, on Vaul. It holds
// a task of its own (export, a phone's settings) and can be dragged away.

import { useRef, type ReactNode } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { Button } from "./button.tsx";
import styles from "./drawer.module.css";

/** Props of {@link Drawer}. */
export interface DrawerProps {
  /** Whether the drawer is open. */
  open: boolean;
  /** Called with the new state when the visitor closes it (Escape, the close button, a press on the
   * dimmed page, or a drag away) or opens it. */
  onOpenChange: (open: boolean) => void;
  /** The drawer's title: its heading and its accessible name. */
  title: string;
  /** What the drawer is for, read out after the title. Omit it when the title says it all. */
  description?: string;
  /** The edge it slides in from. Defaults to `right`. */
  side?: "right" | "bottom";
  /** The content, which scrolls inside the drawer. */
  children: ReactNode;
}

/**
 * A modal drawer with a title row and a close button. Focus moves into it when it opens, stays
 * inside while it is open, and returns to the opener on close; the page behind is dimmed and
 * inert. It follows the system's reduced-motion setting through the duration tokens.
 *
 * @param props - The open state, its change handler, the title and the content.
 * @returns The drawer, in a portal while open.
 */
export function Drawer(props: DrawerProps) {
  const { open, onOpenChange, title, description, side = "right", children } = props;
  // The drawer is opened from outside (no Drawer.Trigger), so Radix does not know where focus
  // came from. Read it in the render that opens the drawer, before focus moves into it, and give
  // it back on close.
  const opener = useRef<Element | null>(null);
  const wasOpen = useRef(false);
  if (open && !wasOpen.current) opener.current = document.activeElement;
  wasOpen.current = open;

  // Vaul leaves focus where it was unless told otherwise (so a phone's keyboard does not pop up);
  // here focus goes in, to the Close button, as a dialog needs.
  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange} direction={side} autoFocus>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className={styles.overlay} />
        <DrawerPrimitive.Content
          className={[styles.content, styles[side]].join(" ")}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (opener.current instanceof HTMLElement) opener.current.focus();
          }}
          // Without a description Radix would warn; this tells it there is none on purpose.
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          <div className={styles.head}>
            <DrawerPrimitive.Title className={styles.title}>{title}</DrawerPrimitive.Title>
            <DrawerPrimitive.Close asChild>
              <Button size="sm" variant="ghost">
                Close
              </Button>
            </DrawerPrimitive.Close>
          </div>
          {description ? (
            <DrawerPrimitive.Description className={styles.description}>
              {description}
            </DrawerPrimitive.Description>
          ) : null}
          <div className={styles.body}>{children}</div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
