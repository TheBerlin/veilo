// Tests for src/components/slider.tsx, in Chromium with the real tokens and styles.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Slider } from "../../src/components/slider.tsx";

/** A controlled speed slider from 0.5 to 2. */
function Speed({ onChange = () => {} }: { onChange?: (value: number) => void }) {
  const [value, setValue] = useState(1);
  return (
    <Slider
      label="Speed"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      min={0.5}
      max={2}
      step={0.1}
      formatValue={(v) => `${v.toFixed(1)}x`}
      startLabel="0.5x"
      endLabel="2x"
    />
  );
}

describe("Slider", () => {
  it("names the thumb by the label and reads the formatted value", () => {
    render(<Speed />);
    const thumb = screen.getByRole("slider", { name: "Speed" });
    expect(thumb.getAttribute("aria-valuenow")).toBe("1");
    expect(thumb.getAttribute("aria-valuetext")).toBe("1.0x");
    expect(thumb.getAttribute("aria-valuemin")).toBe("0.5");
    expect(thumb.getAttribute("aria-valuemax")).toBe("2");
  });

  it("steps with arrow keys and jumps with Home and End", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Speed onChange={onChange} />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith(1.1);
    await user.keyboard("{End}");
    expect(onChange).toHaveBeenLastCalledWith(2);
    await user.keyboard("{Home}");
    expect(onChange).toHaveBeenLastCalledWith(0.5);
  });

  it("shows the end labels under the track, hidden from screen readers", () => {
    render(<Speed />);
    const ends = screen.getByText("2x").parentElement;
    expect(ends?.getAttribute("aria-hidden")).toBe("true");
    expect(ends?.textContent).toBe("0.5x2x");
  });

  it("draws the accent thumb with the focus ring", async () => {
    const user = userEvent.setup();
    render(<Speed />);
    await user.tab();
    const thumb = getComputedStyle(screen.getByRole("slider"));
    expect(thumb.backgroundColor).toBe("rgb(241, 241, 241)");
    expect(thumb.outlineStyle).toBe("solid");
  });
});
