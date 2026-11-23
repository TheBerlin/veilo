// chip.tsx: compact chips, as a lone on/off chip or as a single-choice segmented group.

import * as TogglePrimitive from "@radix-ui/react-toggle";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import {
  createContext,
  forwardRef,
  useContext,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import styles from "./chip.module.css";
import { useSlidingPill } from "./use-sliding-pill.ts";

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

/**
 * Set by a group with `followFocus`: called with an item's value when focus reaches it, so the item
 * is chosen as the arrow keys move onto it. `null` when the group only moves focus.
 */
const FollowFocus = createContext<((value: string) => void) | null>(null);

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
  /**
   * Choose an item as soon as focus reaches it, as a native radio group does with the arrow keys.
   * Off by default: in a group whose choice does something heavy (replays an animation, loads
   * settings), arrowing past an item should not trigger it, and Space or Enter chooses.
   */
  followFocus?: boolean;
}

/**
 * A single-choice segmented group of chips. Arrow keys move between items (and choose them, with
 * `followFocus`), and exactly one item stays chosen. In the `segmented` variant a pill slides to the chosen item.
 *
 * @param props - The value, the change handler, a label and the items.
 * @returns The group element.
 */
export function ChipGroup(props: ChipGroupProps) {
  const {
    value,
    onValueChange,
    className,
    variant = "chips",
    followFocus = false,
    children,
    ...rest
  } = props;
  const group = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  useSlidingPill(group, pill, variant === "segmented", '[data-state="on"]');
  return (
    <ToggleGroupPrimitive.Root
      ref={group}
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
    >
      {variant === "segmented" && <span ref={pill} className={styles.pill} aria-hidden="true" />}
      <FollowFocus.Provider value={followFocus ? onValueChange : null}>
        {children}
      </FollowFocus.Provider>
    </ToggleGroupPrimitive.Root>
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
  function ChipGroupItem({ className, onFocus, ...rest }, ref) {
    const choose = useContext(FollowFocus);
    return (
      <ToggleGroupPrimitive.Item
        ref={ref}
        className={[styles.chip, className].filter(Boolean).join(" ")}
        onFocus={(event) => {
          onFocus?.(event);
          // The item that is already chosen needs no change; every other one is chosen on arrival.
          if (choose && event.currentTarget.dataset.state !== "on") choose(rest.value);
        }}
        {...rest}
      />
    );
  },
);
