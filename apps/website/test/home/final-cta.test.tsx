// Tests for src/home/final-cta.tsx, in Chromium.

import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { FinalCta } from "../../src/home/final-cta.tsx";
import { PLAYGROUND_URL } from "../../src/site/links.ts";

afterEach(async () => {
  await page.viewport(414, 896);
});

describe("FinalCta", () => {
  it("is a section labelled by its h2, which asks the question", () => {
    render(<FinalCta />);
    const section = screen.getByRole("region", { name: "Ready to design your loading state?" });
    expect(within(section).getAllByRole("heading", { level: 2, hidden: true })).toHaveLength(1);
  });

  it("has one action, the primary button that opens the playground, worded as the hero's is", async () => {
    render(<FinalCta />);
    const links = screen.getAllByRole("link", { hidden: true });
    expect(links).toHaveLength(1);
    const link = links[0]!;
    expect(link.textContent).toBe("Open the playground");
    expect(link.getAttribute("href")).toBe(PLAYGROUND_URL);
    // The solid accent fill: the page's primary action, not a plain button.
    const probe = document.createElement("span");
    probe.style.background = "var(--veilo-accent)";
    document.body.append(probe);
    const accent = getComputedStyle(probe).backgroundColor;
    probe.remove();
    // The skeleton covers the button until the reveal ends, so wait for its own fill to return.
    await vi.waitFor(() => expect(getComputedStyle(link).backgroundColor).toBe(accent), {
      timeout: 9000,
    });
  }, 12000);

  it("says only what is true of the playground: it runs in the browser, with no account and nothing to install", () => {
    render(<FinalCta />);
    expect(
      screen.getByText("It runs in your browser. No account, nothing to install."),
    ).toBeTruthy();
  });

  it("on a wide screen: a panel of eight of the twelve columns, centered, with centered text", async () => {
    await page.viewport(1440, 900);
    render(<FinalCta />);
    const heading = screen.getByRole("heading", { level: 2, hidden: true });
    const panel = heading.closest("[class*=panel]")!.getBoundingClientRect();
    // Content is 1200 px wide on a 1440 screen, so eight columns with their seven gutters are 790 px.
    expect(panel.width).toBeGreaterThan(780);
    expect(panel.width).toBeLessThan(800);
    // Centered on the page.
    expect(Math.abs(panel.left + panel.width / 2 - 720)).toBeLessThanOrEqual(1);
    expect(getComputedStyle(heading).textAlign).toBe("center");
    const link = screen.getByRole("link", { hidden: true }).getBoundingClientRect();
    expect(Math.abs(link.left + link.width / 2 - 720)).toBeLessThanOrEqual(1);
  });

  it("on a phone: the panel spans the width and so does the button", async () => {
    await page.viewport(375, 800);
    render(<FinalCta />);
    const heading = screen.getByRole("heading", { level: 2, hidden: true });
    const panel = heading.closest("[class*=panel]")!.getBoundingClientRect();
    expect(panel.width).toBeCloseTo(335, 0);
    const link = screen.getByRole("link", { hidden: true }).getBoundingClientRect();
    // As wide as the panel's content, inside its padding.
    expect(link.width).toBeGreaterThan(panel.width - 80);
    expect(link.left).toBeGreaterThan(panel.left);
    expect(link.right).toBeLessThan(panel.right);
  });
});
