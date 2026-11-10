// grid.tsx: the website's column grid (12 columns on desktop, 4 on mobile) and its cells.

import type { CSSProperties, ReactNode } from "react";
import { GRID, type SPACE } from "../tokens.ts";
import styles from "./grid.module.css";

/** A spacing token name, such as `space-4`, for the gap between rows. */
export type GridRowGap = keyof typeof SPACE;

/** Props of {@link Grid}. */
export interface GridProps {
  /** The cells, usually {@link GridCell}s. */
  children: ReactNode;
  /** The element to render. Defaults to `div`. */
  as?: "div" | "section" | "header" | "footer" | "main" | "nav" | "ul" | "ol";
  /** Gap between rows, as a spacing token. Defaults to none. */
  rowGap?: GridRowGap;
  /** Extra class for the grid. */
  className?: string;
}

/**
 * The page grid, full width with its own side margins. Above the layout breakpoint
 * ({@link GRID_BREAKPOINT}): 12 columns with 20 px gutters; the content is at most 1200 px (the
 * 1440 frame minus its 120 px margins), centered, and the margins never shrink below 32 px.
 * At the breakpoint and below: 4 columns with 8 px gutters and 20 px margins. Margins also
 * grow to the safe-area insets.
 *
 * @param props - The cells, element, row gap and class.
 * @returns The grid element.
 */
export function Grid(props: GridProps) {
  const { children, as: Tag = "div", rowGap, className } = props;
  return (
    <Tag
      className={[styles.grid, className].filter(Boolean).join(" ")}
      style={rowGap ? { rowGap: `var(--veilo-${rowGap})` } : undefined}
    >
      {children}
    </Tag>
  );
}

/** Props of {@link GridCell}. */
export interface GridCellProps {
  /** The content. */
  children?: ReactNode;
  /** Desktop columns to span, 1 to 12. Defaults to 12 (full width). */
  span?: number;
  /** Desktop column to start at, 1 to 12. Defaults to the next free place. */
  start?: number;
  /** Mobile columns to span, 1 to 4. Defaults to 4 (full width). */
  spanMobile?: number;
  /** Mobile column to start at, 1 to 4. Defaults to the next free place. */
  startMobile?: number;
  /** The element to render. Defaults to `div`; use `li` inside a list grid. */
  as?: "div" | "li" | "article" | "aside" | "figure";
  /** Extra class for the cell. */
  className?: string;
}

/**
 * Keeps a span inside the grid and a start where the span still fits.
 *
 * @param columns - The grid's column count.
 * @param span - The requested span.
 * @param start - The requested start, if any.
 * @returns The whole-number span and start (start undefined when not given).
 */
export function fitCell(
  columns: number,
  span: number,
  start?: number,
): { span: number; start?: number } {
  const fitted = Math.min(columns, Math.max(1, Math.round(span)));
  if (start === undefined) return { span: fitted };
  return { span: fitted, start: Math.min(columns - fitted + 1, Math.max(1, Math.round(start))) };
}

/**
 * One block on the grid, placed on whole columns. Spans and starts are clamped to the grid,
 * so a cell never adds a column.
 *
 * @param props - The content, desktop and mobile placement, element and class.
 * @returns The cell element.
 */
export function GridCell(props: GridCellProps) {
  const { children, span = 12, start, spanMobile = 4, startMobile, as: Tag = "div" } = props;
  const desktop = fitCell(GRID.desktop.columns, span, start);
  const mobile = fitCell(GRID.mobile.columns, spanMobile, startMobile);
  // The placement is data, passed as local custom properties that the stylesheet reads.
  const style = {
    "--grid-span": desktop.span,
    "--grid-start": desktop.start ?? "auto",
    "--grid-span-mobile": mobile.span,
    "--grid-start-mobile": mobile.start ?? "auto",
  } as CSSProperties;
  return (
    <Tag className={[styles.cell, props.className].filter(Boolean).join(" ")} style={style}>
      {children}
    </Tag>
  );
}
