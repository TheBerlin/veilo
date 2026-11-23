// badge.tsx: the compact badge: a small label for a version, "Coming soon" or a section eyebrow.

import type { HTMLAttributes } from "react";
import styles from "./badge.module.css";

/** Props of {@link Badge}: any `<span>` attribute, plus the style. */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * `outline` (default): a hairline outline on the page surface. `solid`: the accent fill, for
   * the one highlighted item.
   */
  variant?: "outline" | "solid";
}

/**
 * A compact, non-interactive badge: 24 px high, base radius, in the small label type. Use a
 * chip for anything the visitor can press. Status badges (with a dot or an icon) are not built
 * yet.
 *
 * @param props - The one to three word label as children, the variant and any `<span>` attribute.
 * @returns The `<span>` element.
 */
export function Badge(props: BadgeProps) {
  const { variant = "outline", className, ...rest } = props;
  return (
    <span
      className={[styles.badge, styles[variant], className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
