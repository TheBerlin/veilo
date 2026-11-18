// Tests for src/components/nav.tsx, in Chromium at real viewport sizes with the real tokens.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { Nav } from "../../src/components/nav.tsx";
import { GRID_BREAKPOINT } from "../../src/tokens.ts";

/** A nav with the three site links and a trailing control. */
function renderNav() {
  render(
    <Nav
      brand={<span>Veilo</span>}
      brandLabel="Veilo home"
      links={[
        { label: "Home", href: "/", current: true },
        { label: "Playground", href: "/playground" },
        { label: "GitHub", href: "https://example.com", icon: <svg data-testid="icon" /> },
      ]}
      trailing={<button type="button">Theme</button>}
    />,
  );
}

afterEach(async () => {
  await page.viewport(1280, 720);
});

describe("Nav", () => {
  it("wide: shows the links in a row, with no menu button", async () => {
    await page.viewport(1280, 720);
    renderNav();
    expect(getComputedStyle(screen.getByRole("banner").querySelector("button")!).display).toBe(
      "none",
    );
    const links = screen.getAllByRole("link").filter((link) => link.className.includes("link"));
    expect(links).toHaveLength(3);
    expect(new Set(links.map((link) => Math.round(link.getBoundingClientRect().top))).size).toBe(1);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
  });

  it("marks the current page and names the home link", () => {
    renderNav();
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBe("page");
    expect(
      screen.getByRole("link", { name: "Playground" }).getAttribute("aria-current"),
    ).toBeNull();
    expect(screen.getByRole("link", { name: "Veilo home" })).toBeTruthy();
  });

  it("hides a link's icon from screen readers", () => {
    renderNav();
    expect(screen.getByTestId("icon").closest("[aria-hidden]")).toBeTruthy();
  });

  it("the bar is 64 px high", async () => {
    await page.viewport(1280, 720);
    renderNav();
    expect(screen.getByRole("banner").querySelector("div")!.getBoundingClientRect().height).toBe(
      64,
    );
  });

  it("narrow: the links and the trailing control wait behind the menu button", async () => {
    await page.viewport(GRID_BREAKPOINT, 800);
    renderNav();
    const button = screen.getByRole("button", { name: "Open menu" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    // Closed: the panel is not displayed, so its links are not reachable.
    expect(screen.queryByRole("link", { name: "Playground" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Theme" })).toBeNull();
    await userEvent.click(button);
    expect(screen.getByRole("button", { name: "Close menu" }).getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(screen.getByRole("link", { name: "Playground" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Theme" })).toBeTruthy();
  });

  it("narrow: Escape closes the menu and returns focus to the button", async () => {
    await page.viewport(GRID_BREAKPOINT, 800);
    renderNav();
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    await userEvent.keyboard("{Escape}");
    const button = screen.getByRole("button", { name: "Open menu" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(button);
  });

  it("narrow: choosing a link closes the menu", async () => {
    await page.viewport(GRID_BREAKPOINT, 800);
    renderNav();
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    // The link would navigate; stop that so the test page stays.
    const link = screen.getByRole("link", { name: "Playground" });
    link.addEventListener("click", (event) => event.preventDefault());
    await userEvent.click(link);
    expect(screen.getByRole("button", { name: "Open menu" }).getAttribute("aria-expanded")).toBe(
      "false",
    );
  });

  it("narrow: a tap outside closes the menu", async () => {
    await page.viewport(GRID_BREAKPOINT, 800);
    renderNav();
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    await userEvent.click(document.body);
    expect(screen.getByRole("button", { name: "Open menu" }).getAttribute("aria-expanded")).toBe(
      "false",
    );
  });
});
