// chip.tsx: compact chips, as a lone on/off chip or as a single-choice segmented group.

import * as TogglePrimitive from "@radix-ui/react-toggle";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
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
 * Moves the sliding pill of a segmented group under the chosen item, and keeps it there when the
 * group is resized or its items change size (a font loading, wrapping at a narrow width).
 *
 * @param group - The group element.
 * @param pill - The pill element inside it.
 * @param enabled - Whether the group is the segmented variant; nothing happens otherwise.
 * @param value - The chosen value, so the pill moves when it changes.
 */
function usePill(
  group: React.RefObject<HTMLDivElement | null>,
  pill: React.RefObject<HTMLSpanElement | null>,
  enabled: boolean,
  value: string,
) {
  // Place before paint, so the pill is never seen in the wrong spot. The first placement has no
  // transition: `data-ready` is set only after it, so the pill does not glide in from the corner.
  useLayoutEffect(() => {
    const root = group.current;
    const element = pill.current;
    if (!enabled || !root || !element) return;
    const place = () => {
      const chosen = root.querySelector<HTMLElement>('[data-state="on"]');
      if (!chosen) return;
      element.style.transform = `translate(${chosen.offsetLeft}px, ${chosen.offsetTop}px)`;
      element.style.width = `${chosen.offsetWidth}px`;
      element.style.height = `${chosen.offsetHeight}px`;
      element.dataset.placed = "true";
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(root);
    for (const item of root.querySelectorAll("button")) observer.observe(item);
    return () => observer.disconnect();
  }, [group, pill, enabled, value]);
  // Switch the transition on once the first placement has been painted.
  useEffect(() => {
    const element = pill.current;
    if (!enabled || !element) return;
    const frame = requestAnimationFrame(() => {
      element.dataset.ready = "true";
    });
    return () => cancelAnimationFrame(frame);
  }, [pill, enabled]);
}

/**
 * A single-choice segmented group of chips. Arrow keys move between items, and exactly one item
 * stays chosen. In the `segmented` variant a pill slides to the chosen item.
 *
 * @param props - The value, the change handler, a label and the items.
 * @returns The group element.
 */
export function ChipGroup(props: ChipGroupProps) {
  const { value, onValueChange, className, variant = "chips", children, ...rest } = props;
  const group = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  usePill(group, pill, variant === "segmented", value);
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
      {children}
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
