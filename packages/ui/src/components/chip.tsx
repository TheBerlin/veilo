// chip.tsx: compact chips, as a lone on/off chip or as a single-choice segmented group.

import * as TogglePrimitive from "@radix-ui/react-toggle";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import styles from "./chip.module.css";

/** Props of {@link Chip}: Radix Toggle's, such as `pressed` and `onPressedChange`. */
export type ChipProps = ComponentPropsWithoutRef<typeof TogglePrimitive.Root>;

/**
 * A lone toggle chip. It reports its state with `aria-pressed`.
 *
 * @param props - `pressed`, `onPressedChange`, `disabled` and any `<button>` attribute.
 * @returns The chip button.
 */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { className, ...rest },
  ref,
) {
  return (
    <TogglePrimitive.Root
      ref={ref}
      className={[styles.chip, className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
});

/** Props of {@link ChipGroup}. */
export interface ChipGroupProps {
  /** The chosen item's value. */
  value: string;
  /** Called with the newly chosen value. */
  onValueChange: (value: string) => void;
  /** Names the group for screen readers, for example "Effect". */
  "aria-label": string;
  /** The {@link ChipGroupItem} elements. */
  children: ReactNode;
  /** Disables every item. */
  disabled?: boolean;
  /** Extra class for the group. */
  className?: string;
  /**
   * `chips` (default): separate outlined chips. `segmented`: the chips sit in one raised bar, like
   * the tab bar, for small settings such as the theme.
   */
  variant?: "chips" | "segmented";
}

/**
 * A single-choice segmented group of chips. Arrow keys move between items, and exactly one item
 * stays chosen.
 *
 * @param props - The value, the change handler, a label and the items.
 * @returns The group element.
 */
export function ChipGroup(props: ChipGroupProps) {
  const { value, onValueChange, className, variant = "chips", ...rest } = props;
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      // Radix reports "" when the chosen item is pressed again; keep the choice instead.
      onValueChange={(next) => {
        if (next) onValueChange(next);
      }}
      className={[styles.group, variant === "segmented" && styles.segmented, className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}

/** Props of {@link ChipGroupItem}: Radix ToggleGroup item props, with a required `value`. */
export type ChipGroupItemProps = ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>;

/**
 * One choice inside a {@link ChipGroup}.
 *
 * @param props - The item's `value`, its label as children, and any `<button>` attribute.
 * @returns The chip button.
 */
export const ChipGroupItem = forwardRef<HTMLButtonElement, ChipGroupItemProps>(
  function ChipGroupItem({ className, ...rest }, ref) {
    return (
      <ToggleGroupPrimitive.Item
        ref={ref}
        className={[styles.chip, className].filter(Boolean).join(" ")}
        {...rest}
      />
    );
  },
);
