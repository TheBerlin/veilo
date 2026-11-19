// Tests for src/components/docked-sheet.tsx, in Chromium with the real tokens and styles.

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Button } from "../../src/components/button.tsx";
import { DockedSheet } from "../../src/components/docked-sheet.tsx";

/**
 * A page with a button, a sheet it opens, and a control behind the sheet.
 *
 * @param props - How tall the sheet is, as a fraction of the screen.
 */
function Page({ height }: { height?: number }) {
  const [open, setOpen] = useState(false);
  const [clicks, setClicks] = useState(0);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Settings</Button>
      <Button onClick={() => setClicks((count) => count + 1)}>Behind {clicks}</Button>
      <DockedSheet open={open} onOpenChange={setOpen} title="Settings" height={height}>
        <Button>Inside</Button>
      </DockedSheet>
    </>
  );
}

describe("DockedSheet", () => {
  it("is out of the accessibility tree while down, and a named region while up", async () => {
    const user = userEvent.setup();
    render(<Page />);
    expect(screen.queryByRole("region", { name: "Settings" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Settings" }));
    const sheet = await screen.findByRole("region", { name: "Settings" });
    expect(within(sheet).getByRole("heading", { name: "Settings" })).toBeTruthy();
    expect(within(sheet).getByRole("button", { name: "Inside" })).toBeTruthy();
  });

  it("moves focus to Close on open, and back to the opener on Escape", async () => {
    const user = userEvent.setup();
    render(<Page />);
    const opener = screen.getByRole("button", { name: "Settings" });
    await user.click(opener);
    const sheet = await screen.findByRole("region", { name: "Settings" });
    await expect
      .poll(() => document.activeElement)
      .toBe(within(sheet).getByRole("button", { name: "Close" }));
    await user.keyboard("{Escape}");
    await expect.poll(() => screen.queryByRole("region", { name: "Settings" })).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("closes with its Close button", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.click(await screen.findByRole("button", { name: "Close" }));
    await expect.poll(() => screen.queryByRole("region", { name: "Settings" })).toBeNull();
  });

  it("never dims, inerts or hides the page behind it", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    await screen.findByRole("region", { name: "Settings" });
    // The page's other controls are still in the accessibility tree and still answer a press.
    await user.click(screen.getByRole("button", { name: /Behind/ }));
    expect(screen.getByRole("button", { name: "Behind 1" })).toBeTruthy();
    expect(document.body.getAttribute("aria-hidden")).toBeNull();
    expect(document.querySelector("[aria-hidden='true'], [inert]")).toBeNull();
  });

  it("sits on the bottom edge across the width, as tall as asked", async () => {
    const user = userEvent.setup();
    render(<Page height={0.4} />);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    const sheet = await screen.findByRole("region", { name: "Settings" });
    await expect
      .poll(() => Math.round(sheet.getBoundingClientRect().bottom))
      .toBe(window.innerHeight);
    const box = sheet.getBoundingClientRect();
    expect(Math.round(box.width)).toBe(document.documentElement.clientWidth);
    expect(Math.round(box.height)).toBe(Math.round(window.innerHeight * 0.4));
  });
});
