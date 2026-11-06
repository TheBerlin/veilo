// Tests for src/components/toggle.tsx, in Chromium with the real tokens and styles.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Toggle } from "../../src/components/toggle.tsx";

/** A controlled toggle, as a form would use it. */
function Loop({ disabled = false }: { disabled?: boolean }) {
  const [on, setOn] = useState(false);
  return <Toggle label="Loop" checked={on} onCheckedChange={setOn} disabled={disabled} />;
}

describe("Toggle", () => {
  it("is a switch named by its label", () => {
    render(<Loop />);
    const toggle = screen.getByRole("switch", { name: "Loop" });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });

  it("toggles with Space and with a click on the label", async () => {
    const user = userEvent.setup();
    render(<Loop />);
    const toggle = screen.getByRole("switch");
    await user.tab();
    await user.keyboard(" ");
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    await user.click(screen.getByText("Loop"));
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });

  it("fills the track with the accent and shows the focus ring when on", async () => {
    const user = userEvent.setup();
    render(<Loop />);
    await user.tab();
    await user.keyboard(" ");
    const style = getComputedStyle(screen.getByRole("switch"));
    expect(style.backgroundColor).toBe("rgb(241, 241, 241)");
    expect(style.outlineStyle).toBe("solid");
  });

  it("does not change when disabled", async () => {
    render(<Loop disabled />);
    const toggle = screen.getByRole("switch");
    await userEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });
});
