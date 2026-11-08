// Tests for src/header/preset-chips.tsx (spec 1.5), in Chromium with the real components.

import { presetSettings } from "@veilo/presets";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PresetChips } from "../../src/header/preset-chips.tsx";
import { createSettingsStore } from "../../src/state/settings-store.ts";

/**
 * Renders the chips on a fresh store.
 *
 * @returns The store and a getter for one chip by name.
 */
function renderChips() {
  const store = createSettingsStore();
  render(<PresetChips store={store} />);
  const chip = (name: string) => screen.getByRole("radio", { name });
  return { store, chip };
}

describe("PresetChips", () => {
  it("shows every preset and lights the defaults at first", () => {
    const { chip } = renderChips();
    expect(screen.getAllByRole("radio")).toHaveLength(7);
    expect(chip("Dot upscale").getAttribute("aria-checked")).toBe("true");
  });

  it("loads a preset over the defaults and clears custom colors", async () => {
    const { store, chip } = renderChips();
    act(() => store.getState().setMany({ cols: 90, baseColor: "#112233" }));
    await userEvent.click(chip("Soft pulse"));
    expect(store.getState().settings).toEqual(presetSettings("soft-pulse"));
    expect(store.getState().loads).toBe(1);
    expect(chip("Soft pulse").getAttribute("aria-checked")).toBe("true");
  });

  it("unlights the chip when a control changes a value, and lights it again on a match", () => {
    const { store, chip } = renderChips();
    act(() => store.getState().set("cols", 70));
    expect(screen.queryByRole("radio", { checked: true })).toBeNull();
    act(() => store.getState().set("cols", 64));
    expect(chip("Dot upscale").getAttribute("aria-checked")).toBe("true");
  });

  it("replays when the lit chip is chosen again", async () => {
    const { store, chip } = renderChips();
    await userEvent.click(chip("Dot upscale"));
    await userEvent.click(chip("Dot upscale"));
    expect(store.getState().loads).toBe(2);
  });

  it("chooses with the keyboard", async () => {
    const { store, chip } = renderChips();
    chip("Hex from center").focus();
    await userEvent.keyboard("{Enter}");
    expect(store.getState().settings).toEqual(presetSettings("hex-from-center"));
  });
});
