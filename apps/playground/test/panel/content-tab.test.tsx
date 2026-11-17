// Tests for src/panel/content-tab.tsx and the card layouts it chooses, in Chromium.

import { defaultSettings } from "@veilo/core";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TooltipProvider } from "@veilo/ui";
import { Panel } from "../../src/panel/panel.tsx";
import { createUserPresetsStore } from "../../src/presets/user-presets-store.ts";
import { CARD_LAYOUTS, LAYOUT_IDS } from "../../src/stage/card-layouts.ts";
import { Stage } from "../../src/stage/stage.tsx";
import { TestCard } from "../../src/stage/test-card.tsx";
import { createContentStore } from "../../src/state/content-store.ts";
import { createSettingsStore } from "../../src/state/settings-store.ts";

describe("card layouts", () => {
  for (const id of LAYOUT_IDS) {
    it(`${id}: the card has exactly the table's slots and texts`, () => {
      const layout = CARD_LAYOUTS[id];
      render(<TestCard settings={defaultSettings()} layout={id} />);
      const card = screen.getByRole("button", { name: /Test card/ });
      const slots = [...card.querySelectorAll("[data-veilo-slot]")].map((el) =>
        el.getAttribute("data-veilo-slot"),
      );
      expect(slots.sort()).toEqual(Object.keys(layout.slots).sort());
      for (const part of layout.texts) {
        expect(card.querySelector(`[data-veilo-slot="${part.slot}"]`)?.textContent).toBe(part.text);
      }
      expect(card.style.width).toBe(`${layout.width}px`);
    });
  }

  it("a layout without a large image draws a square image whatever the ratio", () => {
    render(<TestCard settings={defaultSettings()} layout="list" ratio={16 / 9} />);
    const canvas = screen.getByRole("button").querySelector("canvas")!;
    expect(canvas.clientWidth).toBe(canvas.clientHeight);
  });
});

describe("Content tab", () => {
  it("changes the card's layout, and shows the ratio only for layouts with a large image", async () => {
    const user = userEvent.setup();
    const store = createSettingsStore();
    const content = createContentStore();
    render(
      <>
        <Stage store={store} content={content} />
        <TooltipProvider>
          <Panel store={store} presets={createUserPresetsStore(null)} content={content} />
        </TooltipProvider>
      </>,
    );
    expect(screen.getByLabelText("Image ratio")).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: "Content" }));
    await user.selectOptions(screen.getByLabelText("Layout"), "list");

    expect(content.getState().content.layout).toBe("list");
    const card = screen.getByRole("button", { name: /list row/i });
    expect(within(card).getByText("Lightweight 8K polling mouse")).toBeTruthy();
    expect(screen.queryByLabelText("Image ratio")).toBeNull();

    await user.selectOptions(screen.getByLabelText("Layout"), "article");
    expect(screen.getByLabelText("Image ratio")).toBeTruthy();
  });
});
