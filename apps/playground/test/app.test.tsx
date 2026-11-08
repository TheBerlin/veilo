// Tests for src/app.tsx: the page layout of spec 1.1, in Chromium at desktop and phone widths.

import { render, screen } from "@testing-library/react";
import { page } from "vitest/browser";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/app.tsx";

/**
 * The element that wraps the stage, whose position decides whether it sticks.
 *
 * @returns The stage column.
 */
function stageColumn(): HTMLElement {
  return screen.getByRole("region", { name: "Preview" }).parentElement!.parentElement!;
}

describe("App layout", () => {
  afterEach(() => page.viewport(1440, 900));

  it("shows the title, the description and the preset chips in the header", () => {
    render(<App />);
    const header = screen.getByRole("banner");
    expect(header.textContent).toContain("Veilo playground");
    expect(header.querySelector("p")?.textContent).toMatch(/skeleton loaders/);
    expect(screen.getByRole("radiogroup", { name: "Presets" })).toBeTruthy();
  });

  it("keeps the stage sticky beside the panel on wide screens", async () => {
    await page.viewport(1440, 900);
    render(<App />);
    expect(getComputedStyle(stageColumn()).position).toBe("sticky");
    const stage = stageColumn().getBoundingClientRect();
    const panel = screen.getByRole("tablist").getBoundingClientRect();
    expect(panel.left).toBeGreaterThan(stage.right);
  });

  it("stacks stage then panel below 900 px, not sticky, with 16 px gutters", async () => {
    await page.viewport(375, 800);
    render(<App />);
    expect(getComputedStyle(stageColumn()).position).toBe("static");
    const stage = stageColumn().getBoundingClientRect();
    const panel = screen.getByRole("tablist").getBoundingClientRect();
    expect(panel.top).toBeGreaterThan(stage.bottom);
    expect(stage.left).toBe(16);
    expect(document.documentElement.clientWidth - stage.right).toBe(16);
    expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
  });
});
