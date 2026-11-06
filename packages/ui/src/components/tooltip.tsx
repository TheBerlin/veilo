// tooltip.tsx: a short text hint on hover and keyboard focus, on Radix Tooltip.

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactElement, ReactNode } from "react";
import { SPACE } from "../tokens.ts";
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
}

/**
 * Shows `content` next to its child on hover or keyboard focus, and hides it on Escape or blur.
 * While open, the child's `aria-describedby` points at the hint. Needs a {@link TooltipProvider}
 * above it.
 *
 * @param props - The hint, the trigger element and the side.
 * @returns The trigger, plus the hint in a portal while open.
 */
export function Tooltip(props: TooltipProps) {
  const { content, children, side = "top" } = props;
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          className={styles.content}
          side={side}
          sideOffset={SPACE["space-1"]}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
