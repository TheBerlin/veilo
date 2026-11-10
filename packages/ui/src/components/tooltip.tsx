// tooltip.tsx: a short text hint on hover and keyboard focus, on Radix Tooltip.

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { DURATIONS, SPACE } from "../tokens.ts";
import styles from "./tooltip.module.css";

/**
 * Shares the open delay between tooltips. Wrap the app in it once. This is Radix's
 * `Tooltip.Provider`.
 */
export const TooltipProvider = TooltipPrimitive.Provider;

/** Props of {@link Tooltip}. */
export interface TooltipProps {
  /** The hint text. */
  content: ReactNode;
  /** The one focusable element the hint describes. */
  children: ReactElement;
  /** Side of the trigger to show on. Defaults to `top`. */
  side?: "top" | "right" | "bottom" | "left";
  /** How long the hint stays after the pointer or focus leaves, in ms. Defaults to {@link TOOLTIP_HIDE_DELAY}. */
  hideDelay?: number;
}

/** Default time a hint stays after the pointer leaves: the slow duration token (400 ms). */
export const TOOLTIP_HIDE_DELAY = DURATIONS["duration-slow"];

/**
 * Shows `content` next to its child on hover or keyboard focus. When the pointer or focus
 * leaves, the hint stays for `hideDelay` ms; coming back to the trigger or onto the hint
 * itself cancels the hide and restarts the wait on the next leave. Escape hides it at once.
 * While open, the child's `aria-describedby` points at the hint. Needs a
 * {@link TooltipProvider} above it. Side effect: one timer while a hide is pending, cleared on
 * unmount.
 *
 * @param props - The hint, the trigger element, the side and the hide delay.
 * @returns The trigger, plus the hint in a portal while open.
 */
export function Tooltip(props: TooltipProps) {
  const { content, children, side = "top", hideDelay = TOOLTIP_HIDE_DELAY } = props;
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Set by Escape, so the close Radix reports next skips the delay.
  const closeNow = useRef(false);

  const cancelHide = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
  };
  const hideLater = () => {
    cancelHide();
    timer.current = setTimeout(() => setOpen(false), hideDelay);
  };
  useEffect(() => cancelHide, []);

  const onOpenChange = (next: boolean) => {
    if (next) {
      cancelHide();
      setOpen(true);
    } else if (closeNow.current) {
      closeNow.current = false;
      cancelHide();
      setOpen(false);
    } else {
      hideLater();
    }
  };

  return (
    <TooltipPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {/* Back on the trigger while a hide is pending: keep the hint. */}
      <TooltipPrimitive.Trigger asChild onPointerEnter={cancelHide}>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          className={styles.content}
          side={side}
          sideOffset={SPACE["space-1"]}
          onPointerEnter={cancelHide}
          onPointerLeave={hideLater}
          onEscapeKeyDown={() => {
            closeNow.current = true;
          }}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
