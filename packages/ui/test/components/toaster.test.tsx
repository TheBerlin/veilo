// Tests for src/components/toaster.tsx, in Chromium with the real tokens and styles.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../src/components/button.tsx";
import { Toaster, toast } from "../../src/components/toaster.tsx";

afterEach(() => {
  toast.dismiss();
});

describe("Toaster", () => {
  it("shows a message and announces it in a polite region", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Toaster />
        <Button onClick={() => toast("Copied")}>Copy</Button>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Copy" }));
    const message = await screen.findByText("Copied");
    // Sonner keeps its messages in a live region, so screen readers hear them.
    expect(message.closest("[aria-live]")?.getAttribute("aria-live")).toBe("polite");
  });

  it("offers an action, such as Undo, and runs it", async () => {
    const user = userEvent.setup();
    const undo = vi.fn();
    render(
      <>
        <Toaster />
        <Button
          onClick={() => toast("Settings reset.", { action: { label: "Undo", onClick: undo } })}
        >
          Reset
        </Button>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Reset" }));
    await user.click(await screen.findByRole("button", { name: "Undo" }));
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it("replaces a message with the same id, and removes one on request", async () => {
    render(<Toaster />);
    toast("First", { id: "note" });
    await screen.findByText("First");
    toast("Second", { id: "note" });
    await screen.findByText("Second");
    expect(screen.queryByText("First")).toBeNull();
    toast.dismiss("note");
    await expect.poll(() => screen.queryByText("Second")).toBeNull();
  });

  it("draws a message as a raised card in the design system's colors", async () => {
    render(<Toaster />);
    toast("Share link opened.");
    const message = await screen.findByText("Share link opened.");
    const card = message.closest("[data-sonner-toast]") as HTMLElement;
    const computed = getComputedStyle(card);
    // The page's card color, not Sonner's own white or black.
    const probe = document.createElement("i");
    probe.style.color = getComputedStyle(document.documentElement)
      .getPropertyValue("--veilo-card")
      .trim();
    document.body.append(probe);
    const expected = getComputedStyle(probe).color;
    probe.remove();
    expect(computed.backgroundColor).toBe(expected);
    expect(computed.boxShadow).not.toBe("none");
  });
});
