// Tests for src/app.tsx: the page layout of spec 1.1, in Chromium at desktop and phone widths,
// and what the page starts with (frame request, share link, last session, defaults).

import { findPreset, presetSettings, type PresetId } from "@veilo-ui/presets";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { page } from "vitest/browser";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../src/playground/app.tsx";
import {
  LAST_SESSION_DELAY,
  LAST_SESSION_KEY,
  LAST_SESSION_VERSION,
} from "../../src/playground/presets/last-session.ts";
import { encodeShareLink } from "../../src/playground/share/share-link.ts";

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
    // The panel is as tall as the workspace, down to the bottom gutter. The app leaves room for the
    // site header above it (64 px and a hairline), which these tests do not render.
    expect(window.innerHeight - panel.bottom).toBe(16 + 64 + 1);
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

  it("has three tabs: saved presets and export are opened from the top bar, not tabs", () => {
    render(<App />);
    const tabs = within(screen.getByRole("tablist")).getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Loader", "Reveal", "Content"]);
  });

  it("opens My presets in a popover from the top bar, and Escape closes it", async () => {
    const user = userEvent.setup();
    render(<App />);
    const opener = within(screen.getByRole("banner")).getByRole("button", { name: "My presets" });
    await user.click(opener);
    const popover = await screen.findByRole("dialog", { name: "My presets" });
    expect(within(popover).getByRole("textbox", { name: "Preset name" })).toBeTruthy();
    expect(within(popover).getByRole("button", { name: "Save" })).toBeTruthy();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(opener);
  });

  it("opens Export in a drawer with the share link and the code, and Escape closes it", async () => {
    const user = userEvent.setup();
    render(<App />);
    const opener = within(screen.getByRole("banner")).getByRole("button", { name: "Export" });
    await user.click(opener);
    const drawer = await screen.findByRole("dialog", { name: "Export" });
    expect(within(drawer).getByLabelText("Share link")).toBeTruthy();
    expect(within(drawer).getByRole("combobox", { name: "Format" })).toBeTruthy();
    expect(within(drawer).getByRole("textbox", { name: "Settings to load" })).toBeTruthy();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(opener));
  });

  it("is still an app on a phone: it does not scroll, and the settings are in a sheet", async () => {
    await page.viewport(375, 800);
    render(<App />);
    expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(window.innerHeight);
    expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
    // No panel beside the stage: the bottom row has its button.
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("complementary", { name: "Settings" })).toBeNull();
    const stage = stageColumn().getBoundingClientRect();
    expect(stage.left).toBe(16);
    expect(document.documentElement.clientWidth - stage.right).toBe(16);
  });

  it("gives the bottom row four buttons, each at least 44 px tall for a finger", async () => {
    await page.viewport(375, 800);
    render(<App />);
    for (const name of ["Settings", "My presets", "Reset to defaults", "Export"]) {
      const button = screen.getByRole("button", { name });
      expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    }
  });

  it("opens the settings in a docked sheet that leaves the card in view and usable", async () => {
    await page.viewport(375, 800);
    const user = userEvent.setup();
    render(<App />);
    const opener = screen.getByRole("button", { name: "Settings" });
    expect(opener.getAttribute("aria-expanded")).toBe("false");
    await user.click(opener);
    const sheet = await screen.findByRole("region", { name: "Settings" });
    expect(within(sheet).getByRole("tablist")).toBeTruthy();
    expect(opener.getAttribute("aria-expanded")).toBe("true");
    // Not a dialog: nothing dims or hides the page, and the card is still in view above the sheet.
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector("[data-vaul-overlay]")).toBeNull();
    const card = screen.getByRole("button", { name: /Test card/ }).getBoundingClientRect();
    await expect.poll(() => card.top < sheet.getBoundingClientRect().top).toBe(true);
    // The page behind still answers: a preset chosen with the sheet open takes effect.
    await user.click(screen.getByRole("radio", { name: "Hex from center" }));
    expect(
      within(screen.getByRole("radiogroup", { name: "Presets" })).getByRole("radio", {
        checked: true,
      }).textContent,
    ).toBe("Hex from center");
    await user.click(within(sheet).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("region", { name: "Settings" })).toBeNull());
    expect(opener.getAttribute("aria-expanded")).toBe("false");
  });

  it("shows the reset message as a toast with Undo, on any screen", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Reset to defaults" }));
    expect(await screen.findByText(/reset to the defaults/)).toBeTruthy();
    expect(await screen.findByRole("button", { name: "Undo" })).toBeTruthy();
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

  it("opens on a linked preset (?preset=<id>) over the last session, and drops the query", async () => {
    saveSession("soft-pulse");
    window.history.replaceState(null, "", `${window.location.pathname}?preset=hex-from-center`);
    render(<App />);
    expect(litPreset()).toBe("Hex from center");
    // The link has done its job: a reload would return to the last session.
    await waitFor(() => expect(window.location.search).toBe(""));
  });

  it("keeps the path when it drops a linked preset's query", async () => {
    const { pathname } = window.location;
    window.history.replaceState(null, "", `${pathname}?preset=matrix-columns`);
    render(<App />);
    await waitFor(() => expect(window.location.search).toBe(""));
    expect(window.location.pathname).toBe(pathname);
  });

  it("ignores a link to a preset that does not exist, and starts as usual", () => {
    saveSession("soft-pulse");
    window.history.replaceState(null, "", `${window.location.pathname}?preset=no-such-preset`);
    render(<App />);
    expect(litPreset()).toBe("Soft pulse");
  });

  it("lets a share link win over a linked preset", async () => {
    const fragment = await encodeShareLink({ settings: presetSettings("cascade-wave") });
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?preset=hex-from-center${fragment}`,
    );
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
    await userEvent.click(screen.getByRole("tab", { name: "Content" }));
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
    await userEvent.click(screen.getByRole("tab", { name: "Content" }));
    const select = screen.getByRole<HTMLSelectElement>("combobox", { name: "Image ratio" });
    await waitFor(() => expect(select.value).toBe("2:3"));
  });
});
