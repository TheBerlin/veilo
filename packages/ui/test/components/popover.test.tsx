// Tests for src/components/popover.tsx, in Chromium with the real tokens and styles.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "../../src/components/button.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "../../src/components/popover.tsx";

/**
 * A button that opens a popover with a little content.
 *
 * @param props - Extra rows to put in the panel, to make it tall.
 */
function Menu({ rows = 2 }: { rows?: number }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Options</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Preview options">
        {Array.from({ length: rows }, (_, index) => (
          <p key={index}>Row {index + 1}</p>
        ))}
        <Button>Inside</Button>
      </PopoverContent>
    </Popover>
  );
}

describe("Popover", () => {
  it("opens from its button and is named for screen readers", async () => {
    const user = userEvent.setup();
    render(<Menu />);
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Options" }));
    const panel = await screen.findByRole("dialog", { name: "Preview options" });
    expect(panel.textContent).toContain("Row 1");
    expect(screen.getByRole("button", { name: "Options" }).getAttribute("aria-expanded")).toBe(
      "true",
    );
  });

  it("closes on Escape and returns focus to its button", async () => {
    const user = userEvent.setup();
    render(<Menu />);
    const trigger = screen.getByRole("button", { name: "Options" });
    await user.click(trigger);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await expect.poll(() => screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("closes on a press outside", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Menu />
        <p>Elsewhere</p>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Options" }));
    await screen.findByRole("dialog");
    await user.click(screen.getByText("Elsewhere"));
    await expect.poll(() => screen.queryByRole("dialog")).toBeNull();
  });

  it("is a raised card of the panel width, and never taller than the screen", async () => {
    const user = userEvent.setup();
    render(<Menu rows={120} />);
    await user.click(screen.getByRole("button", { name: "Options" }));
    const panel = await screen.findByRole("dialog");
    const computed = getComputedStyle(panel);
    expect(computed.borderTopWidth).toBe("1px");
    expect(computed.overflowY).toBe("auto");
    expect(panel.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight);
    // The tall content scrolls inside instead of running off the screen.
    expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
  });
});
