// button.tsx: the action control, in primary, secondary and ghost variants and three sizes.

import { Slot, Slottable } from "@radix-ui/react-slot";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import styles from "./button.module.css";

/** Props shared by every button. */
interface ButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Look: `primary` is the one solid accent action per view. Defaults to `secondary`. */
  variant?: "primary" | "secondary" | "ghost";
  /** Height 32, 44 or 52 px. Defaults to `md`. */
  size?: "sm" | "md" | "lg";
  /** An inline SVG shown before the label (or alone, with `iconOnly`). */
  icon?: ReactNode;
  /** Renders the single child (for example an `<a>`) with the button's look instead of a `<button>`. */
  asChild?: boolean;
}

/**
 * Props of {@link Button}. An icon-only button must have an `aria-label`, because it has no
 * visible text.
 */
export type ButtonProps = ButtonBaseProps &
  ({ iconOnly?: false } | { iconOnly: true; "aria-label": string });

/**
 * The action control. Use `<Button asChild><a href>…</a></Button>` for navigation.
 *
 * @param props - Variant, size, icon, `asChild` and any `<button>` attribute.
 * @returns A `<button>`, or the child element when `asChild` is set.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    icon,
    iconOnly = false,
    asChild = false,
    className,
    children,
    type,
    ...rest
  },
  ref,
) {
  const Component = asChild ? Slot : "button";
  const classes = [
    styles.button,
    styles[variant],
    size === "md" ? undefined : styles[size],
    iconOnly ? styles.iconOnly : icon ? styles.withIcon : undefined,
    className,
  ];
  return (
    <Component
      ref={ref}
      className={classes.filter(Boolean).join(" ")}
      // A plain button defaults to "button" so it never submits a form by accident.
      type={asChild ? type : (type ?? "button")}
      {...rest}
    >
      {icon}
      <Slottable>{children}</Slottable>
    </Component>
  );
});
