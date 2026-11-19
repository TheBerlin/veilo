// Tests for src/app.tsx: the page layout of spec 1.1, in Chromium at desktop and phone widths,
// and what the page starts with (frame request, share link, last session, defaults).

import { findPreset, presetSettings, type PresetId } from "@veilo-ui/presets";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { page } from "vitest/browser";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/app.tsx";
import {
  LAST_SESSION_DELAY,
  LAST_SESSION_KEY,
  LAST_SESSION_VERSION,
} from "../src/presets/last-session.ts";
import { encodeShareLink } from "../src/share/share-link.ts";

/**
 * The element that wraps the stage, the transport bar and nothing else: the stage's column.
 *
 * @returns The stage column.
 */
function stageColumn(): HTMLElement {
  return screen.getByRole("region", { name: "Preview" }).parentElement!.parentElement!;
}

describe("App layout", () => {
  afterEach(() => page.viewport(1440, 900));

  it("shows the title and the preset chips in one top bar", () => {
    render(<App />);
    const header = screen.getByRole("banner");
    expect(header.textContent).toContain("Veilo playground");
    expect(screen.getByRole("radiogroup", { name: "Presets" })).toBeTruthy();
    // The reset button and the theme switch are in the same bar.
    expect(within(header).getByRole("button", { name: "Reset to defaults" })).toBeTruthy();
  });

  it("fills the screen on a wide screen: the page never scrolls, the panel is beside the stage", async () => {
    await page.viewport(1440, 900);
    render(<App />);
    expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(window.innerHeight);
    const stage = stageColumn().getBoundingClientRect();
    const panel = screen.getByRole("complementary", { name: "Settings" }).getBoundingClientRect();
    expect(panel.left).toBeGreaterThan(stage.right);
    // The panel is as tall as the workspace, down to the bottom gutter.
    expect(window.innerHeight - panel.bottom).toBe(16);
    // The playback controls are in view on the first screen, not below the fold.
    const bar = screen.getByRole("toolbar", { name: "Playback" }).getBoundingClientRect();
    expect(bar.bottom).toBeLessThanOrEqual(window.innerHeight);
  });

  it("scrolls the open tab inside the panel, not the page", async () => {
    await page.viewport(1440, 900);
    render(<App />);
    const open = document.querySelector('[role="tabpanel"]:not([hidden])') as HTMLElement;
    expect(open.scrollHeight).toBeGreaterThan(open.clientHeight);
    expect(getComputedStyle(open).overflowY).toBe("auto");
    expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(window.innerHeight);
  });

  it("leaves no space for the tabs that are closed", async () => {
    await page.viewport(1440, 900);
    render(<App />);
    const closed = [...document.querySelectorAll('[role="tabpanel"][hidden]')];
    expect(closed.length).toBeGreaterThan(0);
    for (const panel of closed) expect(panel.getBoundingClientRect().height).toBe(0);
  });

  it("keeps the top bar one row at 1440 and 1024 px, so the stage does not move", async () => {
    for (const width of [1440, 1024]) {
      await page.viewport(width, 800);
      const { unmount } = render(<App />);
      expect(screen.getByRole("banner").getBoundingClientRect().height).toBeLessThan(64);
      unmount();
    }
  });

  it("shows the reset message under the bar without changing its height", async () => {
    await page.viewport(1440, 900);
    render(<App />);
    const header = screen.getByRole("banner");
    const before = header.getBoundingClientRect().height;
    await userEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));
    await screen.findByText(/reset to the defaults/);
    expect(header.getBoundingClientRect().height).toBe(before);
  });

  it("is a page again below 900 px: stage, then panel, with 16 px gutters and no sideways scroll", async () => {
    await page.viewport(375, 800);
    render(<App />);
    const stage = stageColumn().getBoundingClientRect();
    const panel = screen.getByRole("complementary", { name: "Settings" }).getBoundingClientRect();
    expect(panel.top).toBeGreaterThan(stage.bottom);
    expect(stage.left).toBe(16);
    expect(document.documentElement.clientWidth - stage.right).toBe(16);
    expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
  });
});

/**
 * Puts settings in the last session, as a previous visit would have.
 *
 * @param id - The preset whose settings to save.
 */
function saveSession(id: PresetId) {
  localStorage.setItem(
    LAST_SESSION_KEY,
    JSON.stringify({ version: LAST_SESSION_VERSION, settings: presetSettings(id) }),
  );
}

/**
 * The preset chip that is lit.
 *
 * @returns Its name.
 */
function litPreset() {
  const group = screen.getByRole("radiogroup", { name: "Presets" });
  return within(group).queryByRole("radio", { checked: true })?.textContent ?? null;
}

describe("App startup", () => {
  afterEach(() => {
    const { pathname } = window.location;
    window.history.replaceState(null, "", pathname);
  });

  it("opens on the last session, and saves changes for the next visit", async () => {
    saveSession("soft-pulse");
    render(<App />);
    expect(litPreset()).toBe("Soft pulse");
    await userEvent.click(screen.getByRole("radio", { name: "Matrix columns" }));
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(LAST_SESSION_KEY) ?? "null");
      expect(saved?.settings).toEqual(presetSettings("matrix-columns"));
    });
  });

  it("opens on the defaults without a last session", () => {
    render(<App />);
    expect(litPreset()).toBe(findPreset("dot-upscale")!.name);
  });

  it("lets a share link win over the last session", async () => {
    saveSession("soft-pulse");
    const fragment = await encodeShareLink({ settings: presetSettings("cascade-wave") });
    window.history.replaceState(null, "", window.location.pathname + fragment);
    render(<App />);
    await waitFor(() => expect(litPreset()).toBe("Cascade wave"));
  });

  it("lets a frame request win, and leaves the session untouched", async () => {
    saveSession("soft-pulse");
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?preset=hex-from-center&p=0.5`,
    );
    render(<App />);
    expect(litPreset()).toBe("Hex from center");
    await new Promise((resolve) => setTimeout(resolve, LAST_SESSION_DELAY + 100));
    expect(JSON.parse(localStorage.getItem(LAST_SESSION_KEY)!).settings).toEqual(
      presetSettings("soft-pulse"),
    );
  });

  it("restores the image ratio from the last session, and saves a new one", async () => {
    localStorage.setItem(
      LAST_SESSION_KEY,
      JSON.stringify({
        version: LAST_SESSION_VERSION,
        settings: presetSettings("soft-pulse"),
        content: { ratio: "3:4" },
      }),
    );
    render(<App />);
    const select = screen.getByRole<HTMLSelectElement>("combobox", { name: "Image ratio" });
    expect(select.value).toBe("3:4");
    await userEvent.selectOptions(select, "16:9");
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(LAST_SESSION_KEY) ?? "null");
      expect(saved?.content).toEqual({ ratio: "16:9", layout: "product", texts: {}, widths: {} });
    });
  });

  it("restores the image ratio from a share link", async () => {
    const fragment = await encodeShareLink({
      settings: presetSettings("cascade-wave"),
      content: { ratio: "2:3" },
    });
    window.history.replaceState(null, "", window.location.pathname + fragment);
    render(<App />);
    const select = screen.getByRole<HTMLSelectElement>("combobox", { name: "Image ratio" });
    await waitFor(() => expect(select.value).toBe("2:3"));
  });
});
