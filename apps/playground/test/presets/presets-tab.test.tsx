// Tests for src/presets/presets-tab.tsx, in Chromium with real storage.

import { defaultSettings } from "@veilo/core";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { browserStorage } from "../../src/presets/browser-storage.ts";
import { EMPTY_LIST, NOT_KEPT, PresetsTab } from "../../src/presets/presets-tab.tsx";
import { NAME_ERRORS } from "../../src/presets/user-presets.ts";
import { createUserPresetsStore, USER_PRESETS_KEY } from "../../src/presets/user-presets-store.ts";
import { createSettingsStore } from "../../src/state/settings-store.ts";

/**
 * Renders the tab with real storage (the test setup clears it after each test).
 *
 * @param withStorage - False to render without storage.
 * @returns The two stores.
 */
function renderTab(withStorage = true) {
  const store = createSettingsStore();
  const presets = createUserPresetsStore(withStorage ? browserStorage() : null);
  render(<PresetsTab store={store} presets={presets} />);
  return { store, presets };
}

/**
 * Types a name and presses Save.
 *
 * @param name - The name, or `""` to save with an empty box.
 */
async function saveAs(name: string) {
  const box = screen.getByRole("textbox", { name: "Preset name" });
  await userEvent.clear(box);
  if (name) await userEvent.type(box, name);
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
}

/**
 * The list row of a preset.
 *
 * @param name - The preset's name.
 * @returns The row element.
 */
function row(name: string): HTMLElement {
  const list = screen.getByRole("list", { name: "My presets" });
  return within(list)
    .getAllByRole("listitem")
    .find((item) => item.textContent?.startsWith(name))!;
}

describe("PresetsTab", () => {
  it("starts empty and saves the current settings under a name, kept in storage", async () => {
    const { store, presets } = renderTab();
    expect(screen.getByText(EMPTY_LIST)).toBeTruthy();
    expect(screen.queryByText(NOT_KEPT)).toBeNull();
    act(() => store.getState().set("cols", 40));
    await saveAs("  My grid ");
    expect(presets.getState().presets).toEqual([
      { id: expect.any(String), name: "My grid", settings: store.getState().settings },
    ]);
    expect(screen.getByText("Saved “My grid”.")).toBeTruthy();
    expect(row("My grid").textContent).toContain("In use");
    expect(localStorage.getItem(USER_PRESETS_KEY)).toContain("My grid");
    // The box is cleared for the next name.
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Preset name" }).value).toBe("");
  });

  it("asks for a name only after a save attempt, and says at once when it is taken", async () => {
    const { presets } = renderTab();
    const box = screen.getByRole("textbox", { name: "Preset name" });
    expect(box.getAttribute("aria-invalid")).toBeNull();
    await saveAs("");
    expect(screen.getByText(NAME_ERRORS.empty)).toBeTruthy();
    expect(presets.getState().presets).toHaveLength(0);
    await saveAs("Mine");
    await userEvent.type(box, "MINE");
    expect(screen.getByText(NAME_ERRORS.taken)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(presets.getState().presets).toHaveLength(1);
  });

  it("applies a preset, which plays the full sequence", async () => {
    const { store } = renderTab();
    act(() => store.getState().set("effect", "pulse"));
    await saveAs("Pulse");
    act(() => store.getState().reset());
    const loads = store.getState().loads;
    expect(row("Pulse").textContent).not.toContain("In use");
    await userEvent.click(screen.getByRole("button", { name: "Apply Pulse" }));
    expect(store.getState().settings.effect).toBe("pulse");
    expect(store.getState().loads).toBe(loads + 1);
    expect(row("Pulse").textContent).toContain("In use");
  });

  it("renames with Enter, cancels with Escape, and returns focus to Rename", async () => {
    const { presets } = renderTab();
    await saveAs("Old");
    await userEvent.click(screen.getByRole("button", { name: "Rename Old" }));
    const box = screen.getByRole("textbox", { name: "New name for “Old”" });
    expect(document.activeElement).toBe(box);
    await userEvent.keyboard("{Escape}");
    expect(presets.getState().presets[0]!.name).toBe("Old");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Rename Old" }));

    await userEvent.click(screen.getByRole("button", { name: "Rename Old" }));
    await userEvent.clear(screen.getByRole("textbox", { name: "New name for “Old”" }));
    await userEvent.keyboard("New{Enter}");
    expect(presets.getState().presets[0]!.name).toBe("New");
    expect(screen.getByText("Renamed to “New”.")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Rename New" }));
  });

  it("keeps a rename open while the new name is taken", async () => {
    const { presets } = renderTab();
    await saveAs("One");
    await saveAs("Two");
    await userEvent.click(screen.getByRole("button", { name: "Rename Two" }));
    await userEvent.clear(screen.getByRole("textbox", { name: "New name for “Two”" }));
    await userEvent.keyboard("one");
    expect(screen.getByText(NAME_ERRORS.taken)).toBeTruthy();
    await userEvent.keyboard("{Enter}");
    expect(presets.getState().presets.map((p) => p.name)).toEqual(["One", "Two"]);
    expect(screen.getByRole("textbox", { name: "New name for “Two”" })).toBeTruthy();
  });

  it("updates a preset with the current settings, with Undo", async () => {
    const { store, presets } = renderTab();
    await saveAs("Grid");
    // In use: nothing to update.
    expect(screen.getByRole<HTMLButtonElement>("button", { name: /Update Grid/ }).disabled).toBe(
      true,
    );
    act(() => store.getState().set("cols", 40));
    await userEvent.click(screen.getByRole("button", { name: /Update Grid/ }));
    expect(presets.getState().presets[0]!.settings.cols).toBe(40);
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(presets.getState().presets[0]!.settings).toEqual(defaultSettings());
    expect(screen.getByText("Undone.")).toBeTruthy();
  });

  it("deletes at once, moves focus to Undo, and Undo brings the preset back in place", async () => {
    const { presets } = renderTab();
    await saveAs("A");
    await saveAs("B");
    await userEvent.click(screen.getByRole("button", { name: "Delete A" }));
    expect(presets.getState().presets.map((p) => p.name)).toEqual(["B"]);
    expect(screen.getByText("Deleted “A”.")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Undo" }));
    await userEvent.keyboard("{Enter}");
    expect(presets.getState().presets.map((p) => p.name)).toEqual(["A", "B"]);
  });

  it("offers Undo only until the next action", async () => {
    renderTab();
    await saveAs("A");
    await userEvent.click(screen.getByRole("button", { name: "Delete A" }));
    await saveAs("B");
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  });

  it("says when presets are kept for this visit only", () => {
    renderTab(false);
    expect(screen.getByText(NOT_KEPT)).toBeTruthy();
  });
});
