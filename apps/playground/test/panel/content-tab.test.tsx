// Tests for src/panel/content-tab.tsx and the card layouts it chooses, in Chromium.

import { defaultSettings } from "@veilo-ui/core";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TooltipProvider } from "@veilo-ui/ui";
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

describe("Content tab text", () => {
  /**
   * Renders the stage and panel on one content store, with the Content tab open.
   *
   * @returns The content store and a user.
   */
  async function renderContentTab() {
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
    await user.click(screen.getByRole("tab", { name: "Content" }));
    return { content, user };
  }

  it("shows one field per text part, and typing changes the card after a pause", async () => {
    const { content, user } = await renderContentTab();
    expect(
      screen.getAllByRole("textbox").map((field) => (field as HTMLInputElement).value),
    ).toEqual(CARD_LAYOUTS.product.texts.map((part) => part.text));

    const heading = screen.getByRole("textbox", { name: "Heading" });
    await user.clear(heading);
    await user.type(heading, "Quiet mouse");
    expect(content.getState().content.texts).toEqual({ product: { heading: "Quiet mouse" } });
    // The card is rebuilt once the typing stops.
    await waitFor(
      () => {
        const card = screen.getByRole("button", { name: /Test card/ });
        expect(card.querySelector('[data-veilo-slot="heading"]')?.textContent).toBe("Quiet mouse");
      },
      { timeout: 3000 },
    );
  });

  it("keeps each layout's own edits, and Reset content clears the current layout only", async () => {
    const { content, user } = await renderContentTab();
    await user.type(screen.getByRole("textbox", { name: "Heading" }), "!");
    await user.selectOptions(screen.getByLabelText("Layout"), "list");
    expect((screen.getByRole("textbox", { name: "Title" }) as HTMLInputElement).value).toBe(
      "MCHOSE L7 Pro",
    );
    expect(screen.getByRole("button", { name: "Reset content" })).toHaveProperty("disabled", true);

    await user.type(screen.getByRole("textbox", { name: "Title" }), "?");
    await user.click(screen.getByRole("button", { name: "Reset content" }));
    expect(content.getState().content.texts).toEqual({ product: { heading: "MCHOSE L7 Pro!" } });

    await user.selectOptions(screen.getByLabelText("Layout"), "product");
    expect((screen.getByRole("textbox", { name: "Heading" }) as HTMLInputElement).value).toBe(
      "MCHOSE L7 Pro!",
    );
  });

  it("the width slider sets the card width after a pause, per layout", async () => {
    const { content, user } = await renderContentTab();
    const slider = screen.getByRole("slider", { name: /Card width/ });
    expect(slider.getAttribute("aria-valuenow")).toBe("320");
    slider.focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(content.getState().content.widths).toEqual({ product: 340 });
    await waitFor(
      () => expect(screen.getByRole("button", { name: /Test card/ }).style.width).toBe("340px"),
      { timeout: 3000 },
    );
    // Another layout starts at its own default, and Reset content brings the first one back.
    await user.selectOptions(screen.getByLabelText("Layout"), "list");
    expect(screen.getByRole("slider", { name: /Card width/ }).getAttribute("aria-valuenow")).toBe(
      "480",
    );
    await user.selectOptions(screen.getByLabelText("Layout"), "product");
    await user.click(screen.getByRole("button", { name: "Reset content" }));
    expect(content.getState().content.widths).toEqual({});
  });

  it("limits a field to 120 characters", async () => {
    await renderContentTab();
    const field = screen.getByRole("textbox", { name: "Heading" }) as HTMLInputElement;
    expect(field.maxLength).toBe(120);
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
