// Tests for src/home/how-it-works.tsx and its parts, in Chromium with the real engine.

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { HowItWorks } from "../../src/home/how-it-works.tsx";
import { PLAYGROUND_URL } from "../../src/site/links.ts";
import { EXPORT_INSTALL, PreviewVisual } from "../../src/home/how-visuals.tsx";

afterEach(async () => {
  // Back to the top at once, which also stops a smooth scroll still running from the test (a
  // pressed step title starts one): on a slow machine it would carry on into the next test.
  window.scrollTo({ top: 0, behavior: "instant" });
  await page.viewport(414, 896);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/**
 * A clip by its description: its still frame's alt text before it plays, its video's label after.
 *
 * @param description - A pattern for the description.
 * @returns The element that carries it, or null.
 */
const clip = (description: RegExp) =>
  [...document.querySelectorAll("img[alt], video[aria-label]")].find((element) =>
    description.test(element.getAttribute("alt") ?? element.getAttribute("aria-label") ?? ""),
  ) ?? null;

describe("HowItWorks", () => {
  it("is a section labelled by its h2, with no label above the heading", () => {
    render(<HowItWorks />);
    const section = screen.getByRole("region", { name: /From a tuned effect/ });
    // The heading stands alone: nothing in its block above or beside it.
    expect(within(section).getByRole("heading", { level: 2 }).parentElement!.children).toHaveLength(
      1,
    );
    expect(within(section).getAllByRole("heading", { level: 2 })).toHaveLength(1);
  });

  it("has the three steps in order, each with its text before its visual", () => {
    render(<HowItWorks />);
    const titles = screen.getAllByRole("heading", { level: 3 });
    expect(titles.map((title) => title.textContent)).toEqual(["Tune.", "Preview.", "Export."]);
    for (const title of titles) {
      const step = title.parentElement?.parentElement;
      const text = step?.children[0];
      const visual = step?.children[1];
      expect(text?.contains(title)).toBe(true);
      // The text comes first in the document, so screen readers read it before the visual.
      expect(
        text!.compareDocumentPosition(visual!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("is stacked steps, not pinned, on a small screen", () => {
    // The tests run in a phone-sized frame by default.
    render(<HowItWorks />);
    expect(document.querySelector("[data-phase]")).toBeNull();
    expect(screen.queryByRole("button", { name: "Preview." })).toBeNull();
  });

  it("shows the install command, with a clip of the export above it", () => {
    render(<HowItWorks />);
    expect(screen.getByLabelText("Install command").textContent).toContain(EXPORT_INSTALL);
    expect(EXPORT_INSTALL).toBe("npm install @veilo-ui/react");
    expect(clip(/Export drawer/)).not.toBeNull();
  });

  it("gives each step an underlined link on to the playground", () => {
    render(<HowItWorks />);
    for (const name of [
      "Open the playground",
      "Scrub it in the playground",
      "Export from the playground",
    ]) {
      const link = screen.getByRole("link", { name });
      expect(link.getAttribute("href")).toBe(PLAYGROUND_URL);
      expect(getComputedStyle(link).textDecorationLine).toBe("underline");
    }
  });

  it("has no panel around the examples: the cards sit on the page", () => {
    render(<HowItWorks />);
    const visual = screen.getByRole("heading", { name: "Tune." }).parentElement!.parentElement!
      .children[1]!.firstElementChild as HTMLElement;
    const computed = getComputedStyle(visual);
    expect(computed.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(computed.borderTopWidth).toBe("0px");
  });

  it("does not promise checks the page cannot show", () => {
    render(<HowItWorks />);
    expect(screen.queryByText(/light and dark/)).toBeNull();
  });

  it("says the packages are not out yet", () => {
    render(<HowItWorks />);
    expect(screen.getByText(/arrive with the first public release/)).toBeTruthy();
  });
});

describe("HowItWorks, pinned", () => {
  /** The open step's title, from the step list. */
  const open = () => screen.getByRole("button", { current: "step" }).textContent;

  /** Scrolls to a share, 0 to 1, of the section's pinned stretch. */
  const scrollTo = (share: number) => {
    const section = screen.getByRole("region", { name: /From a tuned effect/ });
    const span = section.offsetHeight - window.innerHeight;
    window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY + span * share);
  };

  it("pins on a wide, tall screen, with the steps as buttons and the first one open", async () => {
    await page.viewport(1440, 900);
    render(<HowItWorks />);
    const section = screen.getByRole("region", { name: /From a tuned effect/ });
    // Three screens tall: the stage's own plus a hold of two.
    expect(section.offsetHeight).toBe(window.innerHeight * 3);
    expect(open()).toBe("Tune.");
    expect(
      screen.getAllByRole("button").filter((button) => /\.$/.test(button.textContent ?? "")),
    ).toHaveLength(3);
  });

  it("opens the steps as the page scrolls, forward and back", async () => {
    await page.viewport(1440, 900);
    render(<HowItWorks />);
    scrollTo(0.5);
    await expect.poll(open, { timeout: 4000 }).toBe("Preview.");
    scrollTo(0.9);
    await expect.poll(open, { timeout: 4000 }).toBe("Export.");
    scrollTo(0.1);
    await expect.poll(open, { timeout: 4000 }).toBe("Tune.");
  });

  /** The Preview readout: "Loading", "Revealing" or "Revealed", with no numbers. */
  const readout = () => screen.getByText(/^(Loading|Revealing|Revealed)$/).textContent ?? "";

  it("keeps a step open through a short dead zone at each boundary", async () => {
    await page.viewport(1440, 900);
    render(<HowItWorks />);
    // Tune ends at a third of the stretch. A little past it (inside the dead zone) it stays open.
    scrollTo(0.3);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(open()).toBe("Tune.");
    scrollTo(0.36);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(open()).toBe("Tune.");
    // Beyond the dead zone Preview takes over,
    scrollTo(0.42);
    await expect.poll(open, { timeout: 4000 }).toBe("Preview.");
    // and coming back, it stays open a little past its own edge too.
    scrollTo(0.3);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(open()).toBe("Preview.");
    scrollTo(0.2);
    await expect.poll(open, { timeout: 4000 }).toBe("Tune.");
  });

  it("plays the skeleton and then the reveal in Preview by itself, whatever the scroll does", async () => {
    await page.viewport(1440, 900);
    render(<HowItWorks />);
    scrollTo(0.5);
    await expect.poll(open, { timeout: 4000 }).toBe("Preview.");
    // The card starts on the skeleton, as while the data loads,
    await expect.poll(readout, { timeout: 4000 }).toBe("Loading");
    // then reveals on its own, with no further scrolling, and rests on the real content.
    await expect.poll(readout, { timeout: 6000 }).not.toBe("Loading");
    await expect.poll(readout, { timeout: 8000 }).toBe("Revealed");
    // There is no progress number: only the state in words.
    expect(screen.queryByText(/^p = /)).toBeNull();
    // The scrubber is the visitor's: it can be dragged to go frame by frame.
    expect(
      screen.getByRole("slider", { name: "Reveal progress" }).getAttribute("data-disabled"),
    ).toBeNull();
  }, 30000);

  it("shows the Tune clip, then the music card with a scrubber, then the Export clip", async () => {
    await page.viewport(1440, 900);
    render(<HowItWorks />);
    const card = () => screen.queryByRole("article", { name: "Demo: a music player" });
    expect(clip(/choosing a card layout/)).not.toBeNull();
    expect(card()).toBeNull();
    scrollTo(0.5);
    await expect.poll(open, { timeout: 4000 }).toBe("Preview.");
    await expect.poll(card, { timeout: 4000 }).not.toBeNull();
    expect(screen.getByRole("slider", { name: "Reveal progress" })).toBeTruthy();
    scrollTo(0.9);
    await expect.poll(open, { timeout: 4000 }).toBe("Export.");
    await expect.poll(card, { timeout: 4000 }).toBeNull();
    expect(clip(/Export drawer/)).not.toBeNull();
  });

  it("jumps to a step when its title is pressed", async () => {
    await page.viewport(1440, 900);
    const user = userEvent.setup();
    render(<HowItWorks />);
    await user.click(screen.getByRole("button", { name: "Export." }));
    await expect.poll(open, { timeout: 5000 }).toBe("Export.");
  });

  it("keeps only the open step's link in the tab order", async () => {
    await page.viewport(1440, 900);
    render(<HowItWorks />);
    const tabIndexOf = (name: string) => screen.getByText(name).getAttribute("tabindex");
    expect(tabIndexOf("Open the playground")).toBe("0");
    expect(tabIndexOf("Scrub it in the playground")).toBe("-1");
    expect(tabIndexOf("Export from the playground")).toBe("-1");
  });

  it("keeps the stage one size whichever step is open", async () => {
    await page.viewport(1440, 900);
    render(<HowItWorks />);
    const height = () =>
      document.querySelector('[data-phase="enter"]')!.parentElement!.getBoundingClientRect().height;
    const first = height();
    scrollTo(0.5);
    await expect.poll(open, { timeout: 4000 }).toBe("Preview.");
    expect(height()).toBe(first);
    scrollTo(0.9);
    await expect.poll(open, { timeout: 4000 }).toBe("Export.");
    expect(height()).toBe(first);
  });
});

describe("PreviewVisual", () => {
  it("has a scrubber that sets the exact frame, and a word that follows the state", async () => {
    const user = userEvent.setup();
    render(<PreviewVisual />);
    const slider = screen.getByRole("slider", { name: "Reveal progress" });
    // The scrubber is enabled once the reveal exists.
    await expect.poll(() => slider.getAttribute("data-disabled"), { timeout: 4000 }).toBeNull();
    slider.focus();
    await user.keyboard("{End}");
    expect(slider.getAttribute("aria-valuetext")).toBe("100%");
    await expect.poll(() => screen.queryByText("Revealed"), { timeout: 4000 }).not.toBeNull();
    await user.keyboard("{Home}");
    expect(slider.getAttribute("aria-valuetext")).toBe("0%");
    // No progress number anywhere: the scrubber's own value text is for screen readers.
    expect(screen.queryByText(/^p = /)).toBeNull();
  });

  it("shows exactly the frame the page asks for, and leaves Replay out", async () => {
    const { rerender } = render(<PreviewVisual scrub={0.5} />);
    const slider = () => screen.getByRole("slider", { name: "Reveal progress" });
    await expect.poll(() => slider().getAttribute("aria-valuetext"), { timeout: 4000 }).toBe("50%");
    expect(screen.getByText("Revealing")).toBeTruthy();
    // The scrubber only displays the page's progress, and there is nothing to replay.
    expect(slider().getAttribute("data-disabled")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Replay" })).toBeNull();
    rerender(<PreviewVisual scrub={0.25} />);
    await expect.poll(() => slider().getAttribute("aria-valuetext"), { timeout: 4000 }).toBe("25%");
  });

  it("shows the skeleton when the page asks for loading", async () => {
    render(<PreviewVisual scrub="loading" />);
    await expect.poll(() => screen.queryByText("Loading"), { timeout: 4000 }).not.toBeNull();
    await expect
      .poll(() => document.querySelector("[data-veilo-skeleton]") !== null, { timeout: 4000 })
      .toBe(true);
  });

  it("shows the cover photograph, not the drawn art, once it is ready", async () => {
    render(<PreviewVisual />);
    await expect.poll(() => document.querySelector("canvas"), { timeout: 4000 }).not.toBeNull();
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    const context = canvas.getContext("2d")!;
    // The drawn art is a magenta gradient with a bright disc; the photograph is pale blue and
    // grey. Sample the top left of the finished frame, where the drawn art is deep blue-violet and
    // the photograph is near white.
    const [red, green, blue] = context.getImageData(2, 2, 1, 1).data;
    expect(red! + green! + blue!).toBeGreaterThan(450);
  });
});

describe("text entrance", () => {
  /** The computed opacity of a step title. */
  const opacity = (name: string) =>
    Number(getComputedStyle(screen.getByRole("heading", { name })).opacity);

  it("holds a text block below the fold hidden until it is scrolled into view, then plays once", async () => {
    render(<HowItWorks />);
    // Export is far below the first screen, so its text waits.
    expect(opacity("Export.")).toBe(0);
    screen.getByRole("heading", { name: "Export." }).scrollIntoView();
    await expect.poll(() => opacity("Export."), { timeout: 3000 }).toBe(1);
    // Scrolling away does not hide it again.
    window.scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(opacity("Export.")).toBe(1);
  });

  it("switches the entrance off under reduced motion, in the stylesheet", () => {
    // The browser decides the media query, so this checks that the rule exists: the text blocks'
    // entrance is cancelled inside a prefers-reduced-motion block.
    render(<HowItWorks />);
    const cancelled = [...document.styleSheets].some((sheet) =>
      [...sheet.cssRules].some(
        (rule) =>
          rule instanceof CSSMediaRule &&
          rule.conditionText.includes("prefers-reduced-motion") &&
          [...rule.cssRules].some(
            (inner) => inner instanceof CSSStyleRule && inner.style.animationName === "none",
          ),
      ),
    );
    expect(cancelled).toBe(true);
  });
});
