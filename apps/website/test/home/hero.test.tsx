// Tests for src/home/hero.tsx and src/home/demo-card.tsx, in Chromium with the real engine.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Hero } from "../../src/home/hero.tsx";
import { GITHUB_URL, INSTALL_COMMAND, PLAYGROUND_URL } from "../../src/site/links.ts";

describe("Hero", () => {
  it("has the page's one h1 and the two actions as links", () => {
    render(<Hero />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Open the playground" }).getAttribute("href")).toBe(
      PLAYGROUND_URL,
    );
    expect(screen.getByRole("link", { name: "Browse presets" }).getAttribute("href")).toBe(
      "#gallery",
    );
  });

  it("shows the install command with a Copy button", () => {
    render(<Hero />);
    expect(screen.getByLabelText("Install command").textContent).toContain(INSTALL_COMMAND);
    expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy();
  });

  it("has a preset switch that starts on Dot upscale and moves when chosen", async () => {
    render(<Hero />);
    expect(screen.getByRole("radio", { name: "Dot upscale" }).getAttribute("aria-checked")).toBe(
      "true",
    );
    await userEvent.click(screen.getByRole("radio", { name: "Mosaic" }));
    expect(screen.getByRole("radio", { name: "Mosaic" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: "Dot upscale" }).getAttribute("aria-checked")).toBe(
      "false",
    );
  });

  it("builds a live reveal on the demo card, and leaves nothing behind when removed", async () => {
    const before = document.head.querySelectorAll("style").length;
    const { unmount } = render(<Hero />);
    const card = screen.getByRole("article", { name: /Demo product card/ });
    // The reveal marks its card once it has taken over; it is created after mount.
    await expect
      .poll(() => card.querySelectorAll("canvas").length, { timeout: 4000 })
      .toBeGreaterThan(1);
    unmount();
    expect(document.querySelectorAll("canvas")).toHaveLength(0);
    expect(document.head.querySelectorAll("style").length).toBe(before);
  });
});

describe("links", () => {
  it("point at the playground and the repository", () => {
    expect(PLAYGROUND_URL).toMatch(/^https:\/\//);
    expect(GITHUB_URL).toBe("https://github.com/TheBerlin/veilo");
  });
});
