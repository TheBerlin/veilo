// grid.test.tsx: the page grid at the two layouts and the widths between them, measured in
// Chromium at real viewport sizes.

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { fitCell, Grid, GridCell } from "../../src/components/grid.tsx";
import { GRID, GRID_BREAKPOINT } from "../../src/tokens.ts";

/** Left edge and width of an element, rounded to 0.1 px. */
function box(element: Element) {
  const rect = element.getBoundingClientRect();
  return { left: Math.round(rect.left * 10) / 10, width: Math.round(rect.width * 10) / 10 };
}

/** Renders a grid with one cell per column, plus a cell that spans `span` from `start`. */
function renderGrid(cell: { span?: number; start?: number; spanMobile?: number }) {
  render(
    <div style={{ margin: 0 }}>
      <Grid>
        <GridCell span={1} spanMobile={1}>
          <span data-testid="first" />
        </GridCell>
        <GridCell {...cell}>
          <span data-testid="cell" />
        </GridCell>
      </Grid>
    </div>,
  );
  return {
    first: box(screen.getByTestId("first").parentElement!),
    cell: box(screen.getByTestId("cell").parentElement!),
  };
}

/**
 * Expected column width for a content width.
 *
 * @param content - Content width in px.
 * @param layout - Which grid.
 * @returns Column width in px.
 */
function column(content: number, layout: keyof typeof GRID) {
  const { columns, gutter } = GRID[layout];
  return (content - (columns - 1) * gutter) / columns;
}

const near = (value: number) => expect.closeTo(value, 0);

describe("Grid", () => {
  afterEach(async () => {
    await page.viewport(1280, 720);
  });

  it("is the 1440 frame at 1440: 120 px margins, 12 columns of about 81.7 px", async () => {
    await page.viewport(1440, 900);
    const { first, cell } = renderGrid({ span: 6, start: 7 });
    expect(first).toEqual({ left: 120, width: near(column(1200, "desktop")) });
    // Columns 7 to 12: the right half, ending at 1320.
    expect(cell.left + cell.width).toBeCloseTo(1320, 0);
    expect(cell.width).toBeCloseTo(column(1200, "desktop") * 6 + 20 * 5, 0);
  });

  it("keeps the content 1200 px and centered on wider screens", async () => {
    await page.viewport(1920, 900);
    const { first } = renderGrid({});
    expect(first.left).toBeCloseTo((1920 - 1200) / 2, 0);
  });

  it("shrinks the margins to 32 px, then the columns, between the layouts", async () => {
    await page.viewport(1024, 900);
    const { first, cell } = renderGrid({});
    expect(first).toEqual({ left: 32, width: near(column(1024 - 64, "desktop")) });
    expect(cell.width).toBeCloseTo(1024 - 64, 0);
  });

  it("uses 12 columns just above the breakpoint", async () => {
    await page.viewport(GRID_BREAKPOINT + 1, 900);
    const { first } = renderGrid({});
    expect(first.width).toBeCloseTo(column(GRID_BREAKPOINT + 1 - 64, "desktop"), 0);
  });

  it("switches to 4 columns, 8 px gutters and 20 px margins at the breakpoint", async () => {
    await page.viewport(GRID_BREAKPOINT, 900);
    const { first } = renderGrid({});
    expect(first).toEqual({ left: 20, width: near(column(GRID_BREAKPOINT - 40, "mobile")) });
  });

  it("is the 375 frame at 375: 335 px content, columns of about 77.8 px", async () => {
    await page.viewport(375, 812);
    const { first, cell } = renderGrid({ span: 6, spanMobile: 2 });
    expect(first).toEqual({ left: 20, width: near(column(335, "mobile")) });
    // Two of four columns, on the same row as the first cell.
    expect(cell.left).toBeCloseTo(20 + column(335, "mobile") + 8, 0);
    expect(cell.width).toBeCloseTo(column(335, "mobile") * 2 + 8, 0);
  });

  it("renders the requested elements and a row gap from the spacing scale", () => {
    render(
      <Grid as="ul" rowGap="space-4">
        <GridCell as="li">One</GridCell>
      </Grid>,
    );
    const list = screen.getByRole("list");
    expect(getComputedStyle(list).rowGap).toBe("32px");
    expect(screen.getByRole("listitem").textContent).toBe("One");
  });
});

describe("fitCell", () => {
  it("rounds and clamps the span to the grid", () => {
    expect(fitCell(12, 0)).toEqual({ span: 1 });
    expect(fitCell(12, 6.4)).toEqual({ span: 6 });
    expect(fitCell(4, 12)).toEqual({ span: 4 });
  });

  it("moves the start left until the span fits", () => {
    expect(fitCell(12, 4, 11)).toEqual({ span: 4, start: 9 });
    expect(fitCell(12, 4, 0)).toEqual({ span: 4, start: 1 });
    expect(fitCell(4, 2, 2)).toEqual({ span: 2, start: 2 });
  });
});
