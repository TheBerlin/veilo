// Tests for src/components/color-field.tsx, in Chromium with the real tokens and styles.

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ColorField } from "../../src/components/color-field.tsx";

/** A controlled base-color field. */
function Base({ onChange = () => {} }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState("#dcdcdc");
  return (
    <ColorField
      label="Base color"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

/**
 * The hex text box of the field.
 *
 * @returns The text input.
 */
function textBox(): HTMLInputElement {
  return screen.getByRole("textbox", { name: "Base color" }) as HTMLInputElement;
}

describe("ColorField", () => {
  it("names both inputs by the label", () => {
    render(<Base />);
    expect(textBox().value).toBe("#dcdcdc");
    const picker = screen.getByLabelText("Base color", { selector: "input[type=color]" });
    expect((picker as HTMLInputElement).value).toBe("#dcdcdc");
  });

  it("reports a typed color only once it is complete, in lower case", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Base onChange={onChange} />);
    await user.clear(textBox());
    await user.type(textBox(), "#27373C");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("#27373c");
  });

  it("marks an unfinished color invalid with a message, then restores it on blur", async () => {
    const user = userEvent.setup();
    render(<Base />);
    await user.clear(textBox());
    await user.type(textBox(), "#12");
    expect(textBox().getAttribute("aria-invalid")).toBe("true");
    const message = document.getElementById(textBox().getAttribute("aria-describedby") ?? "");
    expect(message?.textContent).toBe("Use the format #rrggbb.");
    await user.tab();
    expect(textBox().value).toBe("#dcdcdc");
    expect(textBox().getAttribute("aria-invalid")).toBe("false");
  });

  it("updates the text box when the picker changes", () => {
    render(<Base />);
    const picker = screen.getByLabelText("Base color", { selector: "input[type=color]" });
    fireEvent.input(picker, { target: { value: "#3d5259" } });
    expect(textBox().value).toBe("#3d5259");
  });
});
