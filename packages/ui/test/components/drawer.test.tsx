// Tests for src/components/drawer.tsx, in Chromium with the real tokens and styles.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Button } from "../../src/components/button.tsx";
import { Drawer } from "../../src/components/drawer.tsx";

/**
 * A button that opens a drawer, as an app would.
 *
 * @param props - Which edge, and an optional description.
 */
function Opener({ side, description }: { side?: "right" | "bottom"; description?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Export</Button>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        title="Export"
        description={description}
        side={side}
      >
        <Button>Copy</Button>
      </Drawer>
    </>
  );
}

describe("Drawer", () => {
  it("opens as a dialog named by its title, with its content inside", async () => {
    const user = userEvent.setup();
    render(<Opener />);
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Export" }));
    const dialog = await screen.findByRole("dialog", { name: "Export" });
    expect(dialog.querySelector("h2, [data-vaul-drawer] h2, [id]")).toBeTruthy();
    expect(dialog.textContent).toContain("Copy");
  });

  it("moves focus inside, and closes on Escape with focus back on the opener", async () => {
    const user = userEvent.setup();
    render(<Opener />);
    const opener = screen.getByRole("button", { name: "Export" });
    await user.click(opener);
    const dialog = await screen.findByRole("dialog");
    await expect.poll(() => dialog.contains(document.activeElement)).toBe(true);
    await user.keyboard("{Escape}");
    await expect.poll(() => screen.queryByRole("dialog")).toBeNull();
    await expect.poll(() => document.activeElement).toBe(opener);
  });

  it("closes with its Close button", async () => {
    const user = userEvent.setup();
    render(<Opener />);
    await user.click(screen.getByRole("button", { name: "Export" }));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "Close" }));
    await expect.poll(() => screen.queryByRole("dialog")).toBeNull();
  });

  it("reads out its description when it has one", async () => {
    const user = userEvent.setup();
    render(<Opener description="Copy the settings or the code." />);
    await user.click(screen.getByRole("button", { name: "Export" }));
    const dialog = await screen.findByRole("dialog");
    const describedBy = dialog.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe(
      "Copy the settings or the code.",
    );
  });

  it("sits on the right edge at full height, or on the bottom edge at full width", async () => {
    const user = userEvent.setup();
    const right = render(<Opener side="right" />);
    await user.click(screen.getByRole("button", { name: "Export" }));
    const panel = await screen.findByRole("dialog");
    await expect
      .poll(() => Math.round(panel.getBoundingClientRect().right))
      .toBe(document.documentElement.clientWidth);
    expect(Math.round(panel.getBoundingClientRect().height)).toBe(window.innerHeight);
    right.unmount();

    render(<Opener side="bottom" />);
    await user.click(screen.getByRole("button", { name: "Export" }));
    const sheet = await screen.findByRole("dialog");
    await expect
      .poll(() => Math.round(sheet.getBoundingClientRect().bottom))
      .toBe(window.innerHeight);
    expect(Math.round(sheet.getBoundingClientRect().width)).toBe(
      document.documentElement.clientWidth,
    );
  });
});
