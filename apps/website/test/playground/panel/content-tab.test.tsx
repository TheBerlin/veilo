// Tests for src/panel/content-tab.tsx and the card layouts it chooses, in Chromium.

import { defaultSettings } from "@veilo-ui/core";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TooltipProvider } from "@veilo-ui/ui";
import { Panel } from "../../../src/playground/panel/panel.tsx";
import { CARD_LAYOUTS, LAYOUT_IDS } from "../../../src/playground/stage/card-layouts.ts";
import { Stage } from "../../../src/playground/stage/stage.tsx";
import { TestCard } from "../../../src/playground/stage/test-card.tsx";
import { createContentStore } from "../../../src/playground/state/content-store.ts";
import { createSettingsStore } from "../../../src/playground/state/settings-store.ts";

describe("card layouts", () => {
  for (const id of LAYOUT_IDS) {
    it(`${id}: the card has exactly the table's slots and texts`, async () => {
      const layout = CARD_LAYOUTS[id];
      render(<TestCard settings={defaultSettings()} layout={id} />);
      const card = await screen.findByRole("button", { name: /Test card/ });
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
          <Panel store={store} content={content} />
        </TooltipProvider>
      </>,
    );
    await user.click(screen.getByRole("tab", { name: "Content" }));
    // The music player appears once its cover photograph has loaded.
    await screen.findByRole("button", { name: /Test card/ });
    return { content, user };
  }

  it("shows one field per text part, and typing changes the card after a pause", async () => {
    const { content, user } = await renderContentTab();
    expect(
      screen.getAllByRole("textbox").map((field) => (field as HTMLInputElement).value),
    ).toEqual(CARD_LAYOUTS.music.texts.map((part) => part.text));

    const track = screen.getByRole("textbox", { name: "Track" });
    await user.clear(track);
    await user.type(track, "Quiet street");
    expect(content.getState().content.texts).toEqual({ music: { track: "Quiet street" } });
    // The card is rebuilt once the typing stops.
    await waitFor(
      () => {
        const card = screen.getByRole("button", { name: /Test card/ });
        expect(card.querySelector('[data-veilo-slot="track"]')?.textContent).toBe("Quiet street");
      },
      { timeout: 3000 },
    );
  });

  it("keeps each layout's own edits, and Reset content clears the current layout only", async () => {
    const { content, user } = await renderContentTab();
    await user.type(screen.getByRole("textbox", { name: "Track" }), "!");
    await user.selectOptions(screen.getByLabelText("Layout"), "video");
    expect((screen.getByRole("textbox", { name: "Title" }) as HTMLInputElement).value).toBe(
      "Night walk through the old town in 4K, no talking",
    );
    expect(screen.getByRole("button", { name: "Reset content" })).toHaveProperty("disabled", true);

    await user.type(screen.getByRole("textbox", { name: "Title" }), "?");
    await user.click(screen.getByRole("button", { name: "Reset content" }));
    expect(content.getState().content.texts).toEqual({ music: { track: "Glass Horizon!" } });

    await user.selectOptions(screen.getByLabelText("Layout"), "music");
    expect((screen.getByRole("textbox", { name: "Track" }) as HTMLInputElement).value).toBe(
      "Glass Horizon!",
    );
  });

  it("the width slider sets the card width after a pause, per layout", async () => {
    const { content, user } = await renderContentTab();
    const slider = screen.getByRole("slider", { name: /Card width/ });
    expect(slider.getAttribute("aria-valuenow")).toBe("480");
    slider.focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(content.getState().content.widths).toEqual({ music: 500 });
    await waitFor(
      () => expect(screen.getByRole("button", { name: /Test card/ }).style.width).toBe("500px"),
      { timeout: 3000 },
    );
    // Another layout starts at its own default, and Reset content brings the first one back.
    await user.selectOptions(screen.getByLabelText("Layout"), "video");
    expect(screen.getByRole("slider", { name: /Card width/ }).getAttribute("aria-valuenow")).toBe(
      "320",
    );
    await user.selectOptions(screen.getByLabelText("Layout"), "music");
    await user.click(screen.getByRole("button", { name: "Reset content" }));
    expect(content.getState().content.widths).toEqual({});
  });

  it("limits a field to 120 characters", async () => {
    await renderContentTab();
    const field = screen.getByRole("textbox", { name: "Track" }) as HTMLInputElement;
    expect(field.maxLength).toBe(120);
  });
});

describe("Content tab", () => {
  it("changes the card's layout, and shows the image controls only for layouts with a picture", async () => {
    const user = userEvent.setup();
    const store = createSettingsStore();
    const content = createContentStore();
    render(
      <>
        <Stage store={store} content={content} />
        <TooltipProvider>
          <Panel store={store} content={content} />
        </TooltipProvider>
      </>,
    );
    await user.click(screen.getByRole("tab", { name: "Content" }));
    const ownImage = () => screen.queryByRole("button", { name: "Use my own image" });
    expect(ownImage()).not.toBeNull();
    // The demo cards have a fixed picture shape, so there is no ratio to choose.
    expect(screen.queryByLabelText("Image ratio")).toBeNull();
    await user.selectOptions(screen.getByLabelText("Layout"), "video");

    expect(content.getState().content.layout).toBe("video");
    const card = await screen.findByRole("button", { name: /video tile/i });
    expect(within(card).getByText("Slow Cities")).toBeTruthy();
    expect(ownImage()).not.toBeNull();

    // The inbox has no picture.
    await user.selectOptions(screen.getByLabelText("Layout"), "inbox");
    expect(ownImage()).toBeNull();
  });
});

describe("Content tab image", () => {
  it("offers the samples and the user's own file, and shows the chosen sample", async () => {
    const user = userEvent.setup();
    const store = createSettingsStore();
    const content = createContentStore();
    render(
      <TooltipProvider>
        <Panel store={store} content={content} />
      </TooltipProvider>,
    );
    await user.click(screen.getByRole("tab", { name: "Content" }));
    // The tab's "Image" group and the picker row inside it have the same name.
    const group = screen.getAllByRole("group", { name: "Image" }).at(-1)!;
    expect(within(group).getByRole("button", { name: "Use my own image" })).toBeTruthy();
    const sample = within(group).getAllByRole("button", { pressed: false })[0]!;
    await user.click(sample);
    await waitFor(() => expect(content.getState().photo.sample).not.toBeNull());
    expect(content.getState().photo.loads).toBe(1);
    await user.click(within(group).getByRole("button", { name: "Reset" }));
    await waitFor(() => expect(content.getState().photo.sample).toBeNull());
  });
});
