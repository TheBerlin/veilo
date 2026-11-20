// Tests for src/home/shift-demo.tsx, in Chromium with the real engine and the real photograph.

import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { ShiftDemo } from "../../src/home/shift-demo.tsx";
import { reduceMotion } from "../support/media.ts";

afterEach(async () => {
  vi.restoreAllMocks();
  await page.viewport(414, 896);
});

/**
 * Where each layer's button is, relative to the top of the card's area, over a stretch of time.
 *
 * @param ms - How long to watch.
 * @returns The distinct offsets seen: `veilo` (the layer that sets the size) and `typical`.
 */
async function watchButtons(ms: number) {
  // The Veilo layer appears only once the photograph has loaded, which can take a while on a busy
  // machine; the typical layer's button is there at once.
  await vi.waitFor(() => expect(screen.getAllByText("Buy now")).toHaveLength(2), { timeout: 8000 });
  const buttons = screen.getAllByText("Buy now");
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

  it("draws a guide at the top edge of the button's resting place, across the whole card", async () => {
    render(<ShiftDemo active={false} />);
    await vi.waitFor(() => expect(screen.getAllByText("Buy now")).toHaveLength(2), {
      timeout: 8000,
    });
    const veiloButton = screen.getAllByText("Buy now")[0]!;
    const guide = document.querySelector<HTMLElement>("[class*=guide]")!;
    expect(guide).not.toBeNull();
    const area = screen.getByRole("slider").parentElement!.getBoundingClientRect();
    const line = guide.getBoundingClientRect();
    // On the top edge of Veilo's button, to the pixel, and as wide as the card.
    expect(Math.abs(line.top - veiloButton.getBoundingClientRect().top)).toBeLessThanOrEqual(1);
    expect(line.left).toBeCloseTo(area.left, 0);
    expect(line.right).toBeCloseTo(area.right, 0);
    // It is not something to press: a press on it still moves the divider.
    expect(getComputedStyle(guide).pointerEvents).toBe("none");
  });

  describe("the notes by width", () => {
    /**
     * The first problem tag and the first solution tag.
     *
     * @returns The two tag elements.
     */
    function tags() {
      const items = within(screen.getByRole("list", { name: "What differs" })).getAllByRole(
        "listitem",
      );
      return {
        problem: items[0]!.firstElementChild as HTMLElement,
        solution: items[1]!.firstElementChild as HTMLElement,
        list: items,
      };
    }

    it("on a phone: plain text in two columns under the card, with a hint on how to compare", async () => {
      await page.viewport(375, 800);
      render(<ShiftDemo active={false} />);
      const { problem, solution } = tags();
      // No box: nothing there that looks like a button.
      for (const tag of [problem, solution]) {
        expect(getComputedStyle(tag).borderTopWidth).toBe("0px");
        expect(getComputedStyle(tag).backgroundColor).toBe("rgba(0, 0, 0, 0)");
      }
      // The columns line up with the card's two halves: problems on the left, answers on the right.
      const area = screen.getByRole("slider").parentElement!.getBoundingClientRect();
      expect(problem.getBoundingClientRect().left).toBeCloseTo(area.left, 0);
      expect(solution.getBoundingClientRect().left).toBeGreaterThan(area.left + area.width / 2 - 2);
      // Under the card, not beside it.
      expect(problem.getBoundingClientRect().top).toBeGreaterThanOrEqual(area.bottom);
      // The hint: one of its two wordings shows, whichever the device can do.
      const hints = ["Drag the divider to compare.", "Swipe sideways to compare."].map((text) =>
        screen.getByText(text),
      );
      expect(hints.filter((hint) => getComputedStyle(hint).display !== "none")).toHaveLength(1);
    });

    it("on a wide screen: boxed tags beside the card, outlined and solid, and no hint", async () => {
      await page.viewport(1440, 900);
      render(<ShiftDemo active={false} />);
      const { problem, solution } = tags();
      expect(getComputedStyle(problem).borderTopWidth).toBe("1px");
      expect(getComputedStyle(problem).backgroundColor).toBe("rgba(0, 0, 0, 0)");
      expect(getComputedStyle(solution).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
      const area = screen.getByRole("slider").parentElement!.getBoundingClientRect();
      expect(problem.getBoundingClientRect().right).toBeLessThanOrEqual(area.left);
      expect(solution.getBoundingClientRect().left).toBeGreaterThanOrEqual(area.right);
      for (const text of ["Drag the divider to compare.", "Swipe sideways to compare."]) {
        // Hidden: its paragraph takes no space, so the text has no box at all.
        expect(screen.getByText(text).getClientRects()).toHaveLength(0);
      }
    });
  });

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

    describe("with a finger", () => {
      /**
       * Sets up a touch on the card.
       *
       * @returns The slider, the area, its box and a way to read the divider.
       */
      function touchSetup() {
        render(<ShiftDemo active={false} />);
        const slider = screen.getByRole("slider");
        const area = slider.parentElement!;
        const box = area.getBoundingClientRect();
        const touch = { pointerType: "touch", pointerId: 7, isPrimary: true } as const;
        return {
          slider,
          area,
          box,
          touch,
          value: () => Number(slider.getAttribute("aria-valuenow")),
        };
      }

      it("a press alone does not move the divider", () => {
        const { area, box, touch, value } = touchSetup();
        fireEvent.pointerDown(area, {
          ...touch,
          clientX: box.left + box.width * 0.2,
          clientY: box.top + 50,
        });
        expect(value()).toBe(50);
      });

      it("a vertical swipe leaves the divider alone, however it starts, and a cancel is not a tap", () => {
        const { area, box, touch, value } = touchSetup();
        const x = box.left + box.width * 0.2;
        fireEvent.pointerDown(area, { ...touch, clientX: x, clientY: box.top + 50 });
        fireEvent.pointerMove(area, { ...touch, clientX: x + 3, clientY: box.top + 90 });
        fireEvent.pointerMove(area, { ...touch, clientX: x + 4, clientY: box.top + 140 });
        // The browser takes the gesture to scroll the page and cancels the pointer.
        fireEvent.pointerCancel(area, touch);
        expect(value()).toBe(50);
      });

      it("a vertical swipe that ends normally still leaves the divider alone", () => {
        const { area, box, touch, value } = touchSetup();
        const x = box.left + box.width * 0.2;
        fireEvent.pointerDown(area, { ...touch, clientX: x, clientY: box.top + 50 });
        fireEvent.pointerMove(area, { ...touch, clientX: x + 2, clientY: box.top + 120 });
        fireEvent.pointerUp(area, { ...touch, clientX: x + 2, clientY: box.top + 120 });
        expect(value()).toBe(50);
      });

      it("a sideways swipe drags the divider", () => {
        const { area, box, touch, value } = touchSetup();
        const y = box.top + 80;
        fireEvent.pointerDown(area, { ...touch, clientX: box.left + box.width * 0.5, clientY: y });
        fireEvent.pointerMove(area, {
          ...touch,
          clientX: box.left + box.width * 0.5 + 20,
          clientY: y + 2,
        });
        fireEvent.pointerMove(area, {
          ...touch,
          clientX: box.left + box.width * 0.9,
          clientY: y + 4,
        });
        expect(value()).toBe(90);
        fireEvent.pointerUp(area, {
          ...touch,
          clientX: box.left + box.width * 0.9,
          clientY: y + 4,
        });
        fireEvent.pointerMove(area, { ...touch, clientX: box.left + box.width * 0.1, clientY: y });
        expect(value(), "no drag after the finger lifts").toBe(90);
      });

      it("a tap puts the divider where the finger was", () => {
        const { area, box, touch, value } = touchSetup();
        const point = { ...touch, clientX: box.left + box.width * 0.3, clientY: box.top + 60 };
        fireEvent.pointerDown(area, point);
        fireEvent.pointerUp(area, point);
        expect(value()).toBe(30);
      });

      it("a mouse press still moves it at once", () => {
        const { area, box, value } = touchSetup();
        fireEvent.pointerDown(area, {
          pointerType: "mouse",
          pointerId: 1,
          clientX: box.left + box.width * 0.2,
        });
        expect(value()).toBe(20);
      });
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
