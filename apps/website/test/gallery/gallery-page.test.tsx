// Tests for src/gallery/gallery-page.tsx and the tile it is made of, in Chromium.

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GalleryPage } from "../../src/gallery/gallery-page.tsx";

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

/**
 * Opens the page at an address, for example one that forces the season on.
 *
 * @param search - The query string.
 */
function open(search: string): void {
  window.history.replaceState(null, "", `/gallery${search}`);
  render(<GalleryPage />);
}

/**
 * The names of the tiles, in order.
 *
 * @returns The effect names.
 */
const names = () =>
  screen
    .getAllByRole("article")
    .map((tile) => within(tile).getByRole("heading", { level: 3 }).textContent);

describe("GalleryPage in season", () => {
  it("has one h1, a section heading with the season beside it, and tile names below, in that order", () => {
    open("?season=on");
    expect(screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent)).toEqual([
      "Gallery.",
    ]);
    const h2 = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(h2).toEqual(["Winter effects", "Need something else?"]);
    expect(screen.getByText("Christmas time")).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(10);
  });

  it("shows the ten effects in the Featured order, Snow on the bars first", () => {
    open("?season=on");
    expect(names().slice(0, 3)).toEqual(["Snow on the bars", "Frost grow", "Ice cells"]);
    expect(names()).toHaveLength(10);
    expect(screen.getByRole("status").textContent).toBe("10 effects");
  });

  it("describes each card in plain text: what it does and how it is made, not as badges", () => {
    open("?season=on");
    const tile = screen.getAllByRole("article")[0]!;
    expect(
      within(tile).getByText("Snow falls and settles on the skeleton bars, then melts away."),
    ).toBeTruthy();
    const meta = within(tile).getByText("Loader · Characters · Frost");
    expect(meta.tagName).toBe("P");
  });

  it("gives each card one action, how to use it, and no link into the Playground", () => {
    open("?season=on");
    for (const tile of screen.getAllByRole("article")) {
      expect(within(tile).queryAllByRole("link")).toEqual([]);
      expect(
        within(tile)
          .getAllByRole("button")
          .map((button) => button.textContent),
      ).toEqual(["Use in your project"]);
    }
    expect(screen.queryByText("Open in Playground")).toBeNull();
  });

  it("names each preview for assistive technology and makes it focusable", () => {
    open("?season=on");
    const canvas = screen.getByRole("img", {
      name: "Snow on the bars, animated preview, plays on hover or Enter",
    });
    expect(canvas.getAttribute("tabindex")).toBe("0");
  });

  it("sorts by name when asked", async () => {
    open("?season=on");
    await userEvent.selectOptions(screen.getByLabelText("Sort"), "name");
    expect(names()[0]).toBe("Aurora curtains");
    await userEvent.selectOptions(screen.getByLabelText("Sort"), "newest");
    expect(names()[0]).toBe("Frost cells");
  });

  it("has a flake form switch of four forms, Dendrite chosen, that says what it reaches", async () => {
    open("?season=on");
    const group = screen.getByRole("radiogroup", { name: "Flake shape" });
    const radios = within(group).getAllByRole("radio");
    expect(radios.map((radio) => radio.textContent)).toEqual(["Dendrite", "Fern", "Fir", "Sector"]);
    expect(
      within(group).getByRole("radio", { name: "Dendrite" }).getAttribute("aria-checked"),
    ).toBe("true");
    await userEvent.click(within(group).getByRole("radio", { name: "Fern" }));
    expect(within(group).getByRole("radio", { name: "Fern" }).getAttribute("aria-checked")).toBe(
      "true",
    );
    expect(
      screen.getByText(
        /Applies to 8 of 10 effects\. Snow on the bars and Blizzard dissolve have no flake\./,
      ),
    ).toBeTruthy();
  });

  it("ends with a step into the Playground", () => {
    open("?season=on");
    const end = screen.getByRole("region", { name: "Need something else?" });
    expect(
      within(end).getByRole("link", { name: "Open the Playground" }).getAttribute("href"),
    ).toBe("/playground");
  });

  it("starts each preview on a resting frame once it has been seen, and plays it on Enter", async () => {
    open("?season=on");
    const canvas = screen.getByRole("img", { name: /^Snow on the bars/ });
    await vi.waitFor(() => expect(canvas.getAttribute("data-state")).toBe("rest"), {
      timeout: 8000,
      interval: 100,
    });
    canvas.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(canvas.getAttribute("data-state")).toBe("playing");
  });
});

describe("the use drawer", () => {
  /**
   * Opens the drawer of the first card.
   *
   * @returns The dialog.
   */
  async function openFirst() {
    open("?season=on");
    const tile = screen.getAllByRole("article")[0]!;
    await userEvent.click(within(tile).getByRole("button", { name: "Use in your project" }));
    return screen.findByRole("dialog", { name: "Use Snow on the bars" });
  }

  it("opens with the install command and a JavaScript snippet for that effect", async () => {
    const dialog = await openFirst();
    expect(within(dialog).getByText("npm install @veilo-ui/seasonal")).toBeTruthy();
    expect(within(dialog).getByText(/mountEffect\(container, "bars"\)/)).toBeTruthy();
    expect(within(dialog).getByText(/not on npm yet/i)).toBeTruthy();
  });

  it("switches between JavaScript, React and the web component", async () => {
    const dialog = await openFirst();
    const group = within(dialog).getByRole("radiogroup", { name: "Format" });
    await userEvent.click(within(group).getByRole("radio", { name: "React" }));
    expect(within(dialog).getByText(/<SeasonalEffect name="bars"/)).toBeTruthy();
    await userEvent.click(within(group).getByRole("radio", { name: "Web component" }));
    expect(within(dialog).getByText(/<veilo-seasonal-effect name="bars"/)).toBeTruthy();
  });

  it("passes the flake form chosen on the page into the snippet, for a flake effect", async () => {
    open("?season=on");
    await userEvent.click(screen.getByRole("radio", { name: "Fern" }));
    const tile = screen.getAllByRole("article")[1]!;
    await userEvent.click(within(tile).getByRole("button", { name: "Use in your project" }));
    const dialog = await screen.findByRole("dialog", { name: "Use Frost grow" });
    expect(within(dialog).getByText(/shape: "fern"/)).toBeTruthy();
  });

  it("closes, and gives focus back to the button that opened it", async () => {
    const dialog = await openFirst();
    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});

describe("the status labels", () => {
  it("shows none for the real release, which is the first public one", () => {
    open("?season=on");
    expect(screen.queryByText("New")).toBeNull();
  });

  it("shows New on the three newest effects and the season on every card with ?labels=demo", () => {
    open("?season=on&labels=demo");
    expect(screen.getAllByText("New")).toHaveLength(3);
    // The section's own badge, and one on each of the ten cards.
    expect(screen.getAllByText("Christmas time")).toHaveLength(11);
  });

  it("names the labels in the preview's accessible name", () => {
    open("?season=on&labels=demo");
    expect(
      screen.getByRole("img", {
        name: "Frost cells, New, Christmas time, animated preview, plays on hover or Enter",
      }),
    ).toBeTruthy();
  });
});

describe("GalleryPage out of season", () => {
  it("drops the season and names the section plainly, with every effect still there", () => {
    open("?season=off");
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "All effects",
      "Need something else?",
    ]);
    expect(screen.queryByText("Christmas time")).toBeNull();
    expect(names()).toHaveLength(10);
  });

  it("keeps the flake form switch and the sort", () => {
    open("?season=off");
    expect(screen.getByRole("radiogroup", { name: "Flake shape" })).toBeTruthy();
    expect(screen.getByLabelText("Sort")).toBeTruthy();
  });
});
