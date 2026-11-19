// popover.tsx: a small panel that opens from a button and holds a few controls, on Radix Popover.

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { SPACE } from "../tokens.ts";
import styles from "./popover.module.css";

/**
 * The popover container. It holds the {@link PopoverTrigger} and the {@link PopoverContent}. This
 * is Radix's `Popover.Root`, which has no styles of its own.
 */
export const Popover = PopoverPrimitive.Root;

/**
 * The element that opens the popover; use it with `asChild` around a button. This is Radix's
 * `Popover.Trigger`.
 */
export const PopoverTrigger = PopoverPrimitive.Trigger;

/** Props of {@link PopoverContent}. */
export type PopoverContentProps = ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
  /** Names the panel for screen readers, such as "My presets". */
  "aria-label": string;
};

/**
 * The popover's panel: a raised card in a portal, opening below its trigger and aligned to its
 * end. It is never taller than the room on screen and scrolls inside when its content is. Escape
 * or a press outside closes it and returns focus to the trigger. It arrives with a short scale and
 * fade from the trigger's side, and leaves with a faster fade (Radix keeps it mounted until the
 * exit ends; reduced motion sets the durations to 0).
 *
 * @param props - Radix `Popover.Content` props, and the required `aria-label`.
 * @returns The panel, in a portal while open.
 */
export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  function PopoverContent(
    { className, sideOffset = SPACE["space-1"], align = "end", ...rest },
    ref,
  ) {
    return (
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          ref={ref}
          className={[styles.content, className].filter(Boolean).join(" ")}
          sideOffset={sideOffset}
          align={align}
          collisionPadding={SPACE["space-2"]}
          {...rest}
        />
      </PopoverPrimitive.Portal>
    );
  },
);
