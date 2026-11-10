// Tests for src/components/tooltip.tsx, in Chromium with the real tokens and styles.

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "../../src/components/button.tsx";
import { Tooltip, TooltipProvider } from "../../src/components/tooltip.tsx";

/**
 * An icon button with a hint, opening at once so the test needs no timers.
 *
 * @param props - The hide delay, default 0 so closing needs no timers either.
 */
function Hinted({ hideDelay = 0 }: { hideDelay?: number }) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip content="Replay the reveal" hideDelay={hideDelay}>
        <Button iconOnly aria-label="Replay" />
      </Tooltip>
    </TooltipProvider>
  );
}

describe("Tooltip", () => {
  it("opens on keyboard focus and describes its trigger", async () => {
    const user = userEvent.setup();
    render(<Hinted />);
    await user.tab();
    const hint = await screen.findByRole("tooltip");
    expect(hint.textContent).toBe("Replay the reveal");
    const describedBy = screen.getByRole("button").getAttribute("aria-describedby");
    expect(describedBy).toBe(hint.id);
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<Hinted />);
    await user.tab();
    await screen.findByRole("tooltip");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
  });

  it("opens on hover", async () => {
    const user = userEvent.setup();
    render(<Hinted />);
    await user.hover(screen.getByRole("button"));
    expect((await screen.findByRole("tooltip")).textContent).toBe("Replay the reveal");
  });

  it("stays for the hide delay after the pointer leaves, then hides", async () => {
    const user = userEvent.setup();
    render(<Hinted hideDelay={300} />);
    await user.hover(screen.getByRole("button"));
    await screen.findByRole("tooltip");
    await user.unhover(screen.getByRole("button"));
    await wait(150);
    expect(screen.queryByRole("tooltip")).not.toBeNull();
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
  });

  it("coming back to the trigger or onto the hint cancels the hide", async () => {
    const user = userEvent.setup();
    render(<Hinted hideDelay={300} />);
    const button = screen.getByRole("button");
    await user.hover(button);
    await screen.findByRole("tooltip");

    await user.unhover(button);
    await wait(200);
    await user.hover(button);
    // Past the first leave's deadline: the hide was cancelled.
    await wait(300);
    expect(screen.queryByRole("tooltip")).not.toBeNull();

    await user.unhover(button);
    await wait(200);
    await user.hover(document.querySelector<HTMLElement>("[data-side]")!);
    await wait(300);
    expect(screen.queryByRole("tooltip")).not.toBeNull();
  });
});

/**
 * Waits real time.
 *
 * @param ms - Milliseconds.
 * @returns A promise that resolves after `ms`.
 */
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
