// Tests for src/header/reset-button.tsx, in Chromium.

import { defaultSettings } from "@veilo/core";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RESET_MESSAGE, ResetButton } from "../../src/header/reset-button.tsx";
import { createSettingsStore } from "../../src/state/settings-store.ts";

/**
 * Renders the button on a store with some changes and a custom color.
 *
 * @returns The store, the changed settings, and a getter for the message line.
 */
function renderButton() {
  const store = createSettingsStore({ effect: "pulse", cols: 40, baseColor: "#123456" });
  const changed = store.getState().settings;
  const view = render(<ResetButton store={store} />);
  const message = () => view.container.querySelector("p")!;
  return { store, changed, message };
}

describe("ResetButton", () => {
  it("restores every default, colors included, and plays the full sequence", async () => {
    const { store, message } = renderButton();
    expect(message().textContent).toBe("");
    await userEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));
    expect(store.getState().settings).toEqual(defaultSettings());
    expect(store.getState().loads).toBe(1);
    expect(message().textContent).toContain(RESET_MESSAGE);
    expect(message().getAttribute("aria-live")).toBe("polite");
  });

  it("undoes the reset", async () => {
    const { store, changed, message } = renderButton();
    await userEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(store.getState().settings).toEqual(changed);
    expect(message().textContent).toBe("");
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  });

  it("stops offering Undo after the next change", async () => {
    const { store, message } = renderButton();
    await userEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));
    act(() => store.getState().set("cols", 50));
    expect(message().textContent).toBe("");
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
    expect(store.getState().settings.cols).toBe(50);
  });

  it("offers Undo for the latest reset only", async () => {
    const { store, message } = renderButton();
    const reset = screen.getByRole("button", { name: "Reset to defaults" });
    await userEvent.click(reset);
    act(() => store.getState().set("cols", 50));
    await userEvent.click(reset);
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    // Back to the state just before the second reset, not the first.
    expect(store.getState().settings).toEqual({ ...defaultSettings(), cols: 50 });
    expect(message().textContent).toBe("");
  });
});
