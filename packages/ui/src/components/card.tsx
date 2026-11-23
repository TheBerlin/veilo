// card.tsx: the flat container surface, in a standard size and a large panel size.

import { forwardRef, type ElementType, type HTMLAttributes } from "react";
import styles from "./card.module.css";

/** Props of {@link Card}. */
export interface CardProps extends HTMLAttributes<HTMLElement> {
  /**
   * `card` (default): `radius-lg` with `space-2` padding, for features, tiles and panels.
   * `panel`: `radius-xl` with `space-4` padding, for the hero demo and the playground stage.
   */
  size?: "card" | "panel";
  /** Adds `shadow-soft`, only for a floating or raised surface. Flat by default. */
  raised?: boolean;
  /** The element to render. Defaults to `div`. */
  as?: Extract<ElementType, "div" | "article" | "section" | "li">;
}

/**
 * A container on the `card` fill with a hairline border. The corner radius follows the design
 * rule (outer = inner + padding), so media inside it uses `radius-base`.
 *
 * @param props - The size, `raised`, `as`, and any element attribute.
 * @returns The container element holding the children.
 */
export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { size = "card", raised = false, as: Component = "div", className, ...rest },
  ref,
) {
  const classes = [
    styles.card,
    size === "panel" && styles.panel,
    raised && styles.raised,
    className,
  ];
  return <Component ref={ref as never} className={classes.filter(Boolean).join(" ")} {...rest} />;
});
