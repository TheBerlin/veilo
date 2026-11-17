// Tests for src/panel/export-tab.tsx (spec 1.6), in Chromium with the real tokens.

import { defaultSettings } from "@veilo/core";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
// Core's hand-driven scheduler, shared so both packages drive time the same way.
import { fakeScheduler } from "../../../../packages/core/test/support/scheduler.ts";
import { loaderCss, settingsJson } from "../../src/export/code-formats.ts";
import { appliedMessage, ExportTab, INVALID_JSON } from "../../src/panel/export-tab.tsx";
import { decodeShareLink } from "../../src/share/share-link.ts";
import { Stage } from "../../src/stage/stage.tsx";
import { createContentStore } from "../../src/state/content-store.ts";
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
  it("shows the current settings and CSS, and follows changes", async () => {
    const { store } = renderTab();
    const json = screen.getByLabelText("Settings JSON");
    expect(json.textContent).toContain('"cols": 64');
    act(() => store.getState().set("cols", 40));
    expect(json.textContent).toContain('"cols": 40');
    await userEvent.selectOptions(screen.getByLabelText("Format"), "css");
    expect(screen.getByLabelText("Loader CSS").textContent).toContain(".skeleton {");
  });

  it("lists every code format and shows the chosen one", async () => {
    renderTab();
    const select = screen.getByLabelText("Format") as HTMLSelectElement;
    expect([...select.options].map((option) => option.text)).toEqual([
      "Settings JSON",
      "Loader CSS",
      "Layout JSON",
      "Vanilla JS",
      "React",
      "Web component",
      "CDN",
    ]);
    const expected: Record<string, string> = {
      layout: '"slots"',
      vanilla: "createReveal",
      react: "@veilo/react",
      element: "@veilo/element/define",
      cdn: "cdn.jsdelivr.net",
    };
    for (const [value, text] of Object.entries(expected)) {
      await userEvent.selectOptions(select, value);
      const label = select.selectedOptions[0]!.text;
      expect(screen.getByLabelText(label).textContent, value).toContain(text);
    }
  });

  it("notes that the packages are not on npm yet, only for code that imports them", async () => {
    renderTab();
    const note = /not on npm yet/;
    expect(screen.queryByText(note)).toBeNull();
    await userEvent.selectOptions(screen.getByLabelText("Format"), "react");
    expect(screen.getByText(note)).toBeTruthy();
    await userEvent.selectOptions(screen.getByLabelText("Format"), "css");
    expect(screen.queryByText(note)).toBeNull();
  });

  it("writes the snippets for the card on the stage, and follows its changes", async () => {
    const store = createSettingsStore();
    const content = createContentStore({ layout: "profile", widths: { profile: 450 } });
    render(<ExportTab store={store} content={content} />);
    await userEvent.selectOptions(screen.getByLabelText("Format"), "vanilla");
    const code = () => screen.getByLabelText("Vanilla JS").textContent!;
    expect(code()).toContain("Mara Lindqvist");
    expect(code()).toContain("width: 450px");
    act(() => content.getState().setText("profile", "heading", "Someone Else"));
    expect(code()).toContain("Someone Else");
    act(() => store.getState().set("imageFx", "mosaic"));
    expect(code()).toContain('"imageFx": "mosaic"');
  });

  it("shows a share link for the current page that follows changes", async () => {
    const { store } = renderTab();
    const block = screen.getByLabelText("Share link");
    const linkSettings = async () => {
      const url = new URL(block.textContent!);
      expect(url.origin + url.pathname).toBe(window.location.origin + window.location.pathname);
      expect(url.search).toBe("");
      const result = await decodeShareLink(url.hash);
      return result.ok ? result.payload.settings : null;
    };
    await waitFor(async () => expect(await linkSettings()).toEqual(defaultSettings()));
    act(() => store.getState().set("effect", "pulse"));
    await waitFor(async () =>
      expect(await linkSettings()).toEqual({ ...defaultSettings(), effect: "pulse" }),
    );
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
