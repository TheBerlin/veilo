// Tests for src/components/tabs.tsx, in Chromium with the real tokens and styles.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { page } from "vitest/browser";
import { afterEach, describe, expect, it } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../src/components/tabs.tsx";

/** The playground's three tabs. */
function Sections() {
  return (
    <Tabs defaultValue="loader">
      <TabsList aria-label="Sections">
        <TabsTrigger value="loader">Loader</TabsTrigger>
        <TabsTrigger value="reveal">Reveal</TabsTrigger>
        <TabsTrigger value="export">Export</TabsTrigger>
      </TabsList>
      <TabsContent value="loader">Loader settings</TabsContent>
      <TabsContent value="reveal">Reveal settings</TabsContent>
      <TabsContent value="export">Export code</TabsContent>
    </Tabs>
  );
}

/**
 * The playground's five tabs in a box of the given width.
 *
 * @param props - The box width in px, and whether the bar is stretched.
 * @returns The tabs in the box.
 */
function FiveTabs(props: { width: number; stretch?: boolean }) {
  return (
    <div style={{ width: props.width }}>
      <Tabs defaultValue="loader">
        <TabsList aria-label="Five" stretch={props.stretch}>
          <TabsTrigger value="loader">Loader</TabsTrigger>
          <TabsTrigger value="reveal">Reveal</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

/**
 * The distinct top edges of the tabs, one per row.
 *
 * @returns The row tops.
 */
function tabRows(): number[] {
  const tops = screen.getAllByRole("tab").map((tab) => tab.getBoundingClientRect().top);
  return [...new Set(tops)];
}

describe("Tabs", () => {
  afterEach(() => page.viewport(1440, 900));

  it.each([
    // The 380 px panel minus 16 px padding and a 1 px border on each side.
    ["the desktop panel", 1440, 346],
    // 375 minus 16 px page gutters, 16 px panel padding and 1 px borders on each side.
    ["the panel of the 375 px layout", 375, 309],
  ])("stretched, fits five tabs on one row across %s", async (_name, viewport, width) => {
    await page.viewport(viewport, 800);
    render(<FiveTabs width={width} stretch />);
    expect(tabRows()).toHaveLength(1);
    expect(screen.getByRole("tablist").getBoundingClientRect().width).toBe(width);
    // Shared evenly: no tab is far narrower than another.
    const widths = screen.getAllByRole("tab").map((tab) => tab.getBoundingClientRect().width);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(16);
  });

  it("keeps its usual size when not stretched", () => {
    render(<FiveTabs width={600} />);
    const bar = screen.getByRole("tablist").getBoundingClientRect().width;
    expect(bar).toBeLessThan(600);
    expect(getComputedStyle(screen.getAllByRole("tab")[0]!).paddingLeft).toBe("16px");
  });

  it("wraps tabs that do not fit instead of growing past its box", async () => {
    await page.viewport(375, 800);
    render(<FiveTabs width={200} />);
    expect(tabRows().length).toBeGreaterThan(1);
    expect(screen.getByRole("tablist").getBoundingClientRect().width).toBeLessThanOrEqual(200);
  });

  it("shows the selected tab's panel only", () => {
    render(<Sections />);
    expect(screen.getByRole("tablist", { name: "Sections" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Loader" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").textContent).toBe("Loader settings");
  });

  it("moves and selects with arrow keys, Home and End", async () => {
    const user = userEvent.setup();
    render(<Sections />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tabpanel").textContent).toBe("Reveal settings");
    await user.keyboard("{End}");
    expect(screen.getByRole("tabpanel").textContent).toBe("Export code");
    await user.keyboard("{Home}");
    expect(screen.getByRole("tabpanel").textContent).toBe("Loader settings");
  });

  it("marks the selected tab with a fill and draws the focus ring", async () => {
    const user = userEvent.setup();
    render(<Sections />);
    await user.tab();
    const selected = getComputedStyle(screen.getByRole("tab", { name: "Loader" }));
    const other = getComputedStyle(screen.getByRole("tab", { name: "Reveal" }));
    expect(selected.backgroundColor).toBe("rgb(38, 38, 44)");
    expect(other.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(selected.outlineStyle).toBe("solid");
    expect(selected.height).toBe("40px");
  });

  it("gives the bar the medium radius: 8 px tabs plus 8 px padding", () => {
    render(<Sections />);
    const bar = getComputedStyle(screen.getByRole("tablist"));
    expect(bar.borderTopLeftRadius).toBe("16px");
    expect(bar.paddingTop).toBe("8px");
  });
});
