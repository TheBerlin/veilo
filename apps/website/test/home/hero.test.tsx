// Tests for src/home/hero.tsx and src/home/demo-card.tsx, in Chromium with the real engine.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { Hero } from "../../src/home/hero.tsx";
import { GITHUB_URL, INSTALL_COMMAND, PLAYGROUND_URL } from "../../src/site/links.ts";

describe("Hero", () => {
  it("has the page's one h1 and the two actions as links", () => {
    render(<Hero />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Open the playground" }).getAttribute("href")).toBe(
      PLAYGROUND_URL,
    );
    expect(screen.getByRole("link", { name: "Browse presets" }).getAttribute("href")).toBe(
      "#gallery",
    );
  });

  it("shows the install command with a Copy button", () => {
    render(<Hero />);
    expect(screen.getByLabelText("Install command").textContent).toContain(INSTALL_COMMAND);
    expect(screen.getByRole("button", { name: /^Copy / })).toBeTruthy();
  });

  it("has no preset switch: the demo plays one fixed preset", () => {
    render(<Hero />);
    expect(screen.queryByRole("radiogroup", { name: "Preset on the demo card" })).toBeNull();
    for (const name of ["Dot upscale", "Hex", "Mosaic"]) {
      expect(screen.queryByRole("radio", { name })).toBeNull();
    }
    // The component switch is still there.
    expect(screen.getByRole("radiogroup", { name: "Component on the demo" })).toBeTruthy();
  });

  it("switches between an inbox, a video tile and a music player", async () => {
    render(<Hero />);
    expect(screen.getByRole("article", { name: "Demo: an inbox" })).toBeTruthy();
    await userEvent.click(screen.getByRole("radio", { name: "Video" }));
    expect(screen.getByRole("article", { name: "Demo: a video tile" })).toBeTruthy();
    expect(screen.queryByRole("article", { name: "Demo: an inbox" })).toBeNull();
    await userEvent.click(screen.getByRole("radio", { name: "Music" }));
    expect(screen.getByRole("article", { name: "Demo: a music player" })).toBeTruthy();
  });

  it("builds a live reveal on the demo card, and leaves nothing behind when removed", async () => {
    const before = document.head.querySelectorAll("style").length;
    const { unmount } = render(<Hero />);
    // The reveal writes its skeleton stylesheet once it has taken over the card.
    await expect
      .poll(() => document.head.querySelectorAll("style").length, { timeout: 4000 })
      .toBeGreaterThan(before);
    unmount();
    expect(document.querySelectorAll("canvas")).toHaveLength(0);
    expect(document.head.querySelectorAll("style").length).toBe(before);
  });
});

describe("play once", () => {
  /** The demo's state, as the progress line under the card reports it. */
  const state = () =>
    document.querySelector("[data-demo-state]")?.getAttribute("data-demo-state") ?? "";

  it("plays once and rests, then plays again on a click on the card or on Replay", async () => {
    render(<Hero />);
    await expect.poll(state, { timeout: 9000 }).toBe("revealed");
    // Before, the demo looped about a second after finishing; now it stays on the finished card.
    await new Promise((resolve) => setTimeout(resolve, 2500));
    expect(state()).toBe("revealed");
    expect(state()).toBe("revealed");
    // A click on the card plays it again.
    await userEvent.click(screen.getByRole("article"));
    await expect.poll(state, { timeout: 3000 }).not.toBe("revealed");
    await expect.poll(state, { timeout: 9000 }).toBe("revealed");
    // So does the Replay button, for keyboard users.
    await userEvent.click(screen.getByRole("button", { name: "Replay" }));
    await expect.poll(state, { timeout: 3000 }).not.toBe("revealed");
  }, 30000);
});

describe("R key", () => {
  /** The demo's state, as the progress line under the card reports it. */
  const state = () =>
    document.querySelector("[data-demo-state]")?.getAttribute("data-demo-state") ?? "";

  it("replays on R, and stays quiet with a modifier, in a field, or on key repeat", async () => {
    // One user instance for the whole test, so a key held down is remembered until it is released.
    const user = userEvent.setup();
    render(
      <>
        <input aria-label="Name" />
        <Hero />
      </>,
    );
    await expect.poll(state, { timeout: 9000 }).toBe("revealed");
    const settled = () => new Promise((resolve) => setTimeout(resolve, 500));

    // Ctrl+R (the browser's reload) does nothing here.
    await user.keyboard("{Control>}r{/Control}");
    await settled();
    expect(state()).toBe("revealed");

    // Typing an r into a text field does nothing either.
    await user.click(screen.getByRole("textbox", { name: "Name" }));
    await user.keyboard("r");
    await settled();
    expect(state()).toBe("revealed");
    (document.activeElement as HTMLElement).blur();

    // A plain R, from anywhere on the page, acts as a click on the Replay pill. The pill shows
    // pressed for as long as R is held, and the click, which replays, happens on release.
    const pill = screen.getByRole("button", { name: "Replay" });
    expect(pill.hasAttribute("data-pressed")).toBe(false);
    await user.keyboard("{r>}");
    expect(pill.getAttribute("data-pressed")).toBe("true");
    await settled();
    expect(pill.getAttribute("data-pressed")).toBe("true");
    expect(state()).toBe("revealed");
    await user.keyboard("{/r}");
    await expect.poll(() => pill.hasAttribute("data-pressed")).toBe(false);
    await expect.poll(state, { timeout: 3000 }).not.toBe("revealed");
    await expect.poll(state, { timeout: 9000 }).toBe("revealed");

    // Losing the window's focus while R is held cancels the press, with no click.
    await user.keyboard("{r>}");
    expect(pill.getAttribute("data-pressed")).toBe("true");
    window.dispatchEvent(new Event("blur"));
    await expect.poll(() => pill.hasAttribute("data-pressed")).toBe(false);
    await user.keyboard("{/r}");
    await settled();
    expect(state()).toBe("revealed");

    // The capital letter works too: a tap presses and releases.
    await user.keyboard("R");
    await expect.poll(state, { timeout: 3000 }).not.toBe("revealed");
  }, 40000);

  it("names the shortcut on the Replay button and shows it as a keycap", () => {
    render(<Hero />);
    const button = screen.getByRole("button", { name: "Replay" });
    expect(button.getAttribute("aria-keyshortcuts")).toBe("r");
    expect(button.querySelector("kbd")?.textContent).toBe("R");
  });
});

describe("narrow screens", () => {
  afterEach(async () => {
    await page.viewport(414, 896);
  });

  // A card whose no-wrap text sets its own minimum width overflows the column; this once did.
  it.each(["Inbox", "Video", "Music"])(
    "the %s card fits a 320 and a 375 px screen",
    async (name) => {
      for (const width of [320, 375]) {
        await page.viewport(width, 800);
        const { unmount } = render(<Hero />);
        await userEvent.click(screen.getByRole("radio", { name }));
        const card = screen.getByRole("article");
        expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
        unmount();
      }
    },
  );
});

describe("links", () => {
  it("point at the playground page and the repository", () => {
    expect(PLAYGROUND_URL).toBe("/playground");
    expect(GITHUB_URL).toBe("https://github.com/TheBerlin/veilo");
  });
});
