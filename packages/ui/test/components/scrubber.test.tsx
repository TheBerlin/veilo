// Tests for src/components/scrubber.tsx, in Chromium with the real tokens and styles.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Scrubber } from "../../src/components/scrubber.tsx";

/** A controlled scrubber starting at 25%. */
function Transport(props: { onChange?: (p: number) => void; onCommit?: (p: number) => void }) {
  const [value, setValue] = useState(0.25);
  return (
    <div style={{ width: 400 }}>
      <Scrubber
        value={value}
        onValueChange={(next) => {
          setValue(next);
          props.onChange?.(next);
        }}
        onValueCommit={props.onCommit}
      />
    </div>
  );
}

describe("Scrubber", () => {
  it("is a slider from 0 to 1 that reads as a percentage", () => {
    render(<Transport />);
    const thumb = screen.getByRole("slider", { name: "Progress" });
    expect(thumb.getAttribute("aria-valuemin")).toBe("0");
    expect(thumb.getAttribute("aria-valuemax")).toBe("1");
    expect(thumb.getAttribute("aria-valuetext")).toBe("25%");
  });

  it("moves with keys and commits after each key press", async () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const user = userEvent.setup();
    render(<Transport onChange={onChange} onCommit={onCommit} />);
    await user.tab();
    await user.keyboard("{End}");
    expect(onChange).toHaveBeenLastCalledWith(1);
    expect(onCommit).toHaveBeenLastCalledWith(1);
    expect(screen.getByRole("slider").getAttribute("aria-valuetext")).toBe("100%");
  });

  it("jumps to the clicked point", async () => {
    const onChange = vi.fn();
    render(<Transport onChange={onChange} />);
    const track = screen.getByRole("slider").closest("span[dir]") ?? document.body;
    const box = track.getBoundingClientRect();
    await userEvent.pointer({
      keys: "[MouseLeft]",
      target: track,
      coords: { clientX: box.left + box.width * 0.75, clientY: box.top + box.height / 2 },
    });
    const last = onChange.mock.lastCall?.[0] as number;
    expect(last).toBeCloseTo(0.75, 1);
  });
});
