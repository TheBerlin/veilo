// toaster.tsx: short messages that appear over the page and leave by themselves, on Sonner. The app
// mounts one Toaster and calls `toast` from anywhere; screen readers hear each message.

import { Toaster as SonnerToaster, toast } from "sonner";
import styles from "./toaster.module.css";

/**
 * Shows a message. `toast("Copied")` is a plain one; an `action` adds a button such as Undo;
 * `id` replaces a message of the same id instead of stacking another; `toast.dismiss(id)` removes
 * one early. This is Sonner's own function, whose messages the {@link Toaster} draws.
 */
export { toast };

/** Props of {@link Toaster}. */
export interface ToasterProps {
  /** Where the messages stack. Defaults to the top center, under a top bar. */
  position?: "top-center" | "top-right" | "bottom-center" | "bottom-right";
  /** The distance from that edge, in CSS px or a CSS length such as `64px`. */
  offset?: number | string;
}

/**
 * The place the messages appear. Mount it once, near the root. The messages are cards with the
 * design system's colors, radius and shadow, in both themes; an action button is the accent
 * color. Sonner reads each message out in a polite live region, and its enter and exit motion is
 * switched off by `prefers-reduced-motion`.
 *
 * @param props - Where to stack the messages, and the offset from that edge.
 * @returns The toaster.
 */
export function Toaster(props: ToasterProps) {
  const { position = "top-center", offset } = props;
  return (
    <SonnerToaster
      className={styles.toaster}
      position={position}
      offset={offset}
      // Under 600 px Sonner reads its mobile offset instead, so both follow the one prop.
      mobileOffset={offset}
      toastOptions={{ classNames: { toast: styles.toast, actionButton: styles.action } }}
    />
  );
}
