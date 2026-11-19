// Tests for src/header/reset-button.tsx, in Chromium.

import { defaultSettings } from "@veilo-ui/core";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster, toast } from "@veilo-ui/ui";
import { afterEach, describe, expect, it } from "vitest";
import { RESET_MESSAGE, ResetButton } from "../../../src/playground/header/reset-button.tsx";
import { createContentStore } from "../../../src/playground/state/content-store.ts";
import { createSettingsStore } from "../../../src/playground/state/settings-store.ts";

afterEach(() => {
  toast.dismiss();
});

/**
 * Renders the button on a store with some changes and a custom color, with the toaster that shows
 * its message.
 *
 * @returns The store, the changed settings, and a getter for the message (null when none shows).
 */
function renderButton() {
  const store = createSettingsStore({ effect: "pulse", cols: 40, baseColor: "#123456" });
  const changed = store.getState().settings;
  render(
    <>
      <Toaster />
      <ResetButton store={store} />
    </>,
  );
  const message = () => screen.queryByText(RESET_MESSAGE);
  return { store, changed, message };
}

/** Waits until the message is gone (a toast leaves with a short exit). */
const gone = (message: () => HTMLElement | null) => waitFor(() => expect(message()).toBeNull());

describe("ResetButton", () => {
  it("restores every default, colors included, and plays the full sequence", async () => {
    const { store, message } = renderButton();
    expect(message()).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));
    expect(store.getState().settings).toEqual(defaultSettings());
    expect(store.getState().loads).toBe(1);
    // The message is in Sonner's polite live region, so it is read out without moving focus.
    const text = await screen.findByText(RESET_MESSAGE);
    expect(text.closest("[aria-live]")?.getAttribute("aria-live")).toBe("polite");
  });

  it("undoes the reset", async () => {
    const { store, changed, message } = renderButton();
    await userEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }));
    expect(store.getState().settings).toEqual(changed);
    await gone(message);
    await waitFor(() => expect(screen.queryByRole("button", { name: "Undo" })).toBeNull());
  });

  it("stops offering Undo after the next change", async () => {
    const { store, message } = renderButton();
    await userEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));
    await screen.findByText(RESET_MESSAGE);
    act(() => store.getState().set("cols", 50));
    await gone(message);
    await waitFor(() => expect(screen.queryByRole("button", { name: "Undo" })).toBeNull());
    expect(store.getState().settings.cols).toBe(50);
  });

  it("offers Undo for the latest reset only", async () => {
    const { store, message } = renderButton();
    const reset = screen.getByRole("button", { name: "Reset to defaults" });
    await userEvent.click(reset);
    await screen.findByText(RESET_MESSAGE);
    act(() => store.getState().set("cols", 50));
    await gone(message);
    await userEvent.click(reset);
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }));
    // Back to the state just before the second reset, not the first.
    expect(store.getState().settings).toEqual({ ...defaultSettings(), cols: 50 });
    await gone(message);
  });

  describe("with a content store", () => {
    /**
     * Renders the button on changed settings and a 16:9 image ratio.
     *
     * @returns Both stores.
     */
    function renderWithContent() {
      const store = createSettingsStore({ cols: 40 });
      const content = createContentStore({ ratio: "16:9" });
      render(
        <>
          <Toaster />
          <ResetButton store={store} content={content} />
        </>,
      );
      return { store, content };
    }

    it("sets the image ratio back to square", async () => {
      const { content } = renderWithContent();
      await userEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));
      expect(content.getState().content.ratio).toBe("1:1");
    });

    it("undoes the ratio with the settings", async () => {
      const { store, content } = renderWithContent();
      await userEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));
      await userEvent.click(await screen.findByRole("button", { name: "Undo" }));
      expect(content.getState().content.ratio).toBe("16:9");
      expect(store.getState().settings.cols).toBe(40);
    });

    it("stops offering Undo after a content change", async () => {
      const { content } = renderWithContent();
      await userEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));
      await screen.findByText(RESET_MESSAGE);
      act(() => content.getState().setRatio("4:3"));
      await waitFor(() => expect(screen.queryByRole("button", { name: "Undo" })).toBeNull());
      expect(content.getState().content.ratio).toBe("4:3");
    });
  });
});
