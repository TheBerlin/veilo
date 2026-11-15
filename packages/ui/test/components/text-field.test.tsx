// Tests for src/components/text-field.tsx, in Chromium with the real tokens and styles.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ColorField } from "../../src/components/color-field.tsx";
import { TextField, type TextFieldProps } from "../../src/components/text-field.tsx";

/**
 * A controlled box.
 *
 * @param props - Options passed through to the field.
 * @returns The box.
 */
function Box(props: Partial<TextFieldProps>) {
  const [value, setValue] = useState("");
  return <TextField label="Name" value={value} onValueChange={setValue} {...props} />;
}

/**
 * The box by its label.
 *
 * @returns The input element.
 */
function box() {
  return screen.getByRole<HTMLInputElement>("textbox", { name: "Name" });
}

describe("TextField", () => {
  it("is a one-line text input named by its label, with autocomplete off", () => {
    render(<Box />);
    expect(box().tagName).toBe("INPUT");
    expect(box().type).toBe("text");
    expect(box().getAttribute("autocomplete")).toBe("off");
    expect(box().getAttribute("aria-invalid")).toBeNull();
    expect(box().getAttribute("aria-describedby")).toBeNull();
  });

  it("reports every edit and stops at maxLength", async () => {
    render(<Box maxLength={5} />);
    await userEvent.type(box(), "Dot upscale");
    expect(box().value).toBe("Dot u");
  });

  it("links its hint for screen readers", () => {
    render(<Box hint="Up to 40 characters." />);
    const id = box().getAttribute("aria-describedby")!;
    expect(document.getElementById(id)?.textContent).toBe("Up to 40 characters.");
  });

  it("marks an error in words and color, in place of the hint", () => {
    render(<Box hint="Up to 40 characters." error="Give the preset a name." />);
    expect(box().getAttribute("aria-invalid")).toBe("true");
    const message = document.getElementById(box().getAttribute("aria-describedby")!)!;
    expect(message.textContent).toBe("Give the preset a name.");
    expect(screen.queryByText("Up to 40 characters.")).toBeNull();
    // Border and message use the danger token, not the usual outline color.
    const danger = getComputedStyle(message).color;
    expect(getComputedStyle(box()).borderTopColor).toBe(danger);
  });

  it("focuses itself only when asked, and passes key presses on", async () => {
    const onKeyDown = vi.fn();
    const { unmount } = render(<Box />);
    expect(document.activeElement).not.toBe(box());
    unmount();
    render(<Box autoFocus onKeyDown={onKeyDown} />);
    expect(document.activeElement).toBe(box());
    await userEvent.keyboard("{Escape}");
    expect(onKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: "Escape" }));
  });

  it("lines up with a shorter field beside it in a grid row", () => {
    render(
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <ColorField label="Base color" value="#dcdcdc" onValueChange={() => {}} />
        <Box hint="Up to 40 characters." />
      </div>,
    );
    // Before fields packed their rows at the top, the color box sat lower than the name box.
    const color = screen.getAllByRole("textbox", { name: "Base color" })[0]!;
    expect(color.getBoundingClientRect().top).toBe(box().getBoundingClientRect().top);
  });

  it("is as tall as small controls and uses the body font", () => {
    render(<Box />);
    expect(box().getBoundingClientRect().height).toBe(32);
    expect(getComputedStyle(box()).fontSize).toBe("16px");
  });
});
