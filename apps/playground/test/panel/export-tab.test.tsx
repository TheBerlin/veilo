// Tests for src/panel/export-tab.tsx (spec 1.6), in Chromium with the real tokens.

import { defaultSettings } from "@veilo/core";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
// Core's hand-driven scheduler, shared so both packages drive time the same way.
import { fakeScheduler } from "../../../../packages/core/test/support/scheduler.ts";
import {
  appliedMessage,
  ExportTab,
  INVALID_JSON,
  loaderCss,
  settingsJson,
} from "../../src/panel/export-tab.tsx";
import { Stage } from "../../src/stage/stage.tsx";
import { createSettingsStore } from "../../src/state/settings-store.ts";

/**
 * Renders the Export tab on a fresh store.
 *
 * @returns The store.
 */
function renderTab() {
  const store = createSettingsStore();
  render(<ExportTab store={store} />);
  return { store };
}

/**
 * Pastes text into the load box and applies it.
 *
 * @param text - The pasted text.
 */
async function apply(text: string) {
  const box = screen.getByRole("textbox", { name: "Settings to load" });
  await userEvent.click(box);
  await userEvent.paste(text);
  await userEvent.click(screen.getByRole("button", { name: "Apply settings" }));
}

describe("export helpers", () => {
  it("write the settings as indented JSON that loads back", () => {
    const json = settingsJson(defaultSettings());
    expect(JSON.parse(json)).toEqual(defaultSettings());
    expect(json).toContain('\n  "effect": "shimmer"');
  });

  it("write loader CSS for .skeleton with hex colors", () => {
    const css = loaderCss(defaultSettings(), "#171717", "#262626");
    expect(css).toMatch(/^\.skeleton \{/m);
    expect(css).toContain("color: transparent;");
    expect(css).toContain("#171717");
    expect(css).not.toContain("var(--veilo-base");
  });

  it("explain how to set --i for the wave effect", () => {
    expect(loaderCss({ ...defaultSettings(), effect: "wave" }, "#000000", "#ffffff")).toContain(
      "Set --i on each element",
    );
  });

  it("count applied settings in words", () => {
    expect(appliedMessage(1)).toBe("1 setting applied.");
    expect(appliedMessage(3)).toBe("3 settings applied.");
  });
});

describe("ExportTab", () => {
  it("shows the current settings and CSS, and follows changes", () => {
    const { store } = renderTab();
    const json = screen.getByLabelText("Settings JSON");
    expect(json.textContent).toContain('"cols": 64');
    act(() => store.getState().set("cols", 40));
    expect(json.textContent).toContain('"cols": 40');
    expect(screen.getByLabelText("Loader CSS").textContent).toContain(".skeleton {");
  });

  it("applies pasted settings and says how many", async () => {
    const { store } = renderTab();
    await apply('{ "effect": "wave", "cols": 40, "nonsense": true }');
    expect(store.getState().settings.effect).toBe("wave");
    expect(store.getState().settings.cols).toBe(40);
    expect(screen.getByText("2 settings applied.")).toBeTruthy();
  });

  it("rejects text that is not JSON and keeps the settings", async () => {
    const { store } = renderTab();
    await apply("{ effect: wave");
    expect(screen.getByText(INVALID_JSON)).toBeTruthy();
    expect(store.getState().settings).toEqual(defaultSettings());
  });

  it("plays the full sequence after loading, even for Reveal keys only", async () => {
    const store = createSettingsStore();
    const clock = fakeScheduler();
    render(
      <>
        <Stage store={store} revealOptions={{ scheduler: clock.scheduler }} />
        <ExportTab store={store} />
      </>,
    );
    window.scrollTo(0, 0);
    const card = () => screen.getByRole("button", { name: /Test card/ });
    const first = card();
    await apply('{ "cols": 40 }');
    await waitFor(() => expect(card()).not.toBe(first));
    await waitFor(() => expect(card().getAttribute("aria-busy")).toBe("true"));
  });
});
