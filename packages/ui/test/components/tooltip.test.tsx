// Tests for src/components/tooltip.tsx, in Chromium with the real tokens and styles.

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "../../src/components/button.tsx";
import { Tooltip, TooltipProvider } from "../../src/components/tooltip.tsx";

/** An icon button with a hint, opening at once so the test needs no timers. */
function Hinted() {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip content="Replay the reveal">
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
});
