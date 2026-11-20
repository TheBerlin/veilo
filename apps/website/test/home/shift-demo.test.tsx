// Tests for src/home/shift-demo.tsx, in Chromium with the real engine and the real photograph.

import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShiftDemo } from "../../src/home/shift-demo.tsx";

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Where each layer's button is, relative to the top of the card's area, over a stretch of time.
 *
 * @param ms - How long to watch.
 * @returns The distinct offsets seen: `veilo` (the layer that sets the size) and `typical`.
 */
async function watchButtons(ms: number) {
  const buttons = await screen.findAllByText("Buy now");
  expect(buttons).toHaveLength(2);
  const [veilo, typical] = buttons as [HTMLElement, HTMLElement];
  const area = screen.getByRole("slider").parentElement!;
  const offset = (button: HTMLElement) =>
    Math.round(button.getBoundingClientRect().top - area.getBoundingClientRect().top);
  const seen = { veilo: new Set<number>(), typical: new Set<number>() };
  for (let waited = 0; waited < ms; waited += 50) {
    seen.veilo.add(offset(veilo));
    seen.typical.add(offset(typical));
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return seen;
}

/** Makes the page ask for less motion. */
function reduceMotion() {
  const real = window.matchMedia.bind(window);
  // A media query list's methods need the real object as `this`.
  const bound = (media: MediaQueryList, key: string | symbol) => {
    const value = Reflect.get(media, key);
    return typeof value === "function" ? value.bind(media) : value;
  };
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) =>
    query.includes("prefers-reduced-motion")
      ? (new Proxy(real(query), {
          get: (media, key) => (key === "matches" ? true : bound(media, key)),
        }) as MediaQueryList)
      : real(query),
  );
}

describe("ShiftDemo", () => {
  it("shows the typical loader's button jumping and Veilo's staying put", async () => {
    render(<ShiftDemo active />);
    // A whole cycle: 1.2 s of loading, the reveal, a 0.9 s gap, loading again.
    const seen = await watchButtons(7000);
    expect(seen.veilo.size, "Veilo's button never moves").toBe(1);
    expect(seen.typical.size, "the typical loader's button jumps").toBeGreaterThan(1);
  }, 15000);

  it("under reduced motion: one still picture, Veilo's finished card beside a typical loader still loading", async () => {
    reduceMotion();
    render(<ShiftDemo active />);
    const seen = await watchButtons(3000);
    expect(seen.veilo.size).toBe(1);
    expect(seen.typical.size).toBe(1);
    // The typical loader's button sits higher than Veilo's finished one: that is the whole point.
    expect([...seen.typical][0]!).toBeLessThan([...seen.veilo][0]!);
  }, 15000);

  it("explains the difference in a list: each problem next to its answer", () => {
    render(<ShiftDemo active={false} />);
    const items = within(screen.getByRole("list", { name: "What differs" })).getAllByRole(
      "listitem",
    );
    expect(items.map((item) => [item.dataset.side, item.textContent])).toEqual([
      ["problem", "No room kept for the text"],
      ["solution", "Text lines are reserved"],
      ["problem", "The button jumps when the text lands"],
      ["solution", "The button never moves"],
    ]);
  });

  describe("the divider", () => {
    it("is a slider with a name and a value, starting in the middle", () => {
      render(<ShiftDemo active={false} />);
      const slider = screen.getByRole("slider", { name: "Compare a typical loader with Veilo" });
      expect(slider.getAttribute("aria-valuenow")).toBe("50");
      expect(slider.getAttribute("aria-valuetext")).toBe("50% typical loader, 50% Veilo");
    });

    it("moves with the arrow keys, in bigger steps with Shift, and to the ends", async () => {
      render(<ShiftDemo active={false} />);
      const slider = screen.getByRole("slider");
      slider.focus();
      const value = () => slider.getAttribute("aria-valuenow");
      await userEvent.keyboard("{ArrowRight}");
      expect(value()).toBe("55");
      await userEvent.keyboard("{Shift>}{ArrowLeft}{/Shift}");
      expect(value()).toBe("35");
      await userEvent.keyboard("{Home}");
      expect(value()).toBe("0");
      await userEvent.keyboard("{ArrowLeft}");
      expect(value(), "stays at the end").toBe("0");
      await userEvent.keyboard("{End}");
      expect(value()).toBe("100");
    });

    it("follows a press anywhere on the card", () => {
      render(<ShiftDemo active={false} />);
      const slider = screen.getByRole("slider");
      const area = slider.parentElement!;
      const box = area.getBoundingClientRect();
      fireEvent.pointerDown(area, { clientX: box.left + box.width * 0.25, pointerId: 1 });
      expect(Number(slider.getAttribute("aria-valuenow"))).toBe(25);
      fireEvent.pointerMove(area, { clientX: box.left + box.width * 0.8, pointerId: 1 });
      expect(Number(slider.getAttribute("aria-valuenow"))).toBe(80);
      fireEvent.pointerUp(area, { pointerId: 1 });
      fireEvent.pointerMove(area, { clientX: box.left + box.width * 0.1, pointerId: 1 });
      expect(Number(slider.getAttribute("aria-valuenow")), "no drag after release").toBe(80);
    });

    it("shows the typical layer only to the left of the divider", () => {
      render(<ShiftDemo active={false} />);
      const slider = screen.getByRole("slider");
      slider.focus();
      const before = document.querySelector<HTMLElement>("[class*=before]")!;
      const clip = () => getComputedStyle(before).clipPath;
      expect(clip()).toMatch(/inset\(0px 50% 0px 0px\)|inset\(0px 50%/);
      fireEvent.keyDown(slider, { key: "End" });
      expect(clip()).toMatch(/inset\(0px 0%|inset\(0px 0px 0px 0px\)/);
    });
  });
});
