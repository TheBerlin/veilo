// Tests for src/components/curve-editor.tsx, in Chromium with the real tokens and styles.

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  CurveEditor,
  formatCurve,
  snapToStep,
  type CurveValue,
} from "../../src/components/curve-editor.tsx";

/** A controlled editor starting at ease out. */
function Ease({
  start = [0.22, 1, 0.36, 1],
  onChange = () => {},
}: {
  start?: CurveValue;
  onChange?: (value: CurveValue) => void;
}) {
  const [value, setValue] = useState<CurveValue>(start);
  return (
    <div style={{ width: 300 }}>
      <CurveEditor
        label="Easing curve"
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onChange(next);
        }}
      />
    </div>
  );
}

describe("helpers", () => {
  it("snaps to the step without float noise", () => {
    expect(snapToStep(0.1 + 0.2, 0.01)).toBe(0.3);
    expect(snapToStep(0.226, 0.01)).toBe(0.23);
    expect(snapToStep(-0.604, 0.01)).toBe(-0.6);
  });

  it("formats the CSS function", () => {
    expect(formatCurve([0.22, 1, 0.36, 1])).toBe("cubic-bezier(0.22, 1.00, 0.36, 1.00)");
  });
});

describe("CurveEditor", () => {
  it("names the graph and both handles and shows the curve", () => {
    render(<Ease />);
    expect(screen.getByRole("group", { name: "Easing curve" })).toBeTruthy();
    expect(screen.getByText("cubic-bezier(0.22, 1.00, 0.36, 1.00)")).toBeTruthy();
    const start = screen.getByRole("slider", { name: "Start handle" });
    expect(start.getAttribute("aria-valuetext")).toBe("x 0.22, y 1.00");
    expect(start.getAttribute("aria-valuemin")).toBe("-0.6");
    expect(start.getAttribute("aria-valuemax")).toBe("1.6");
    expect(screen.getByRole("slider", { name: "End handle" }).getAttribute("aria-valuetext")).toBe(
      "x 0.36, y 1.00",
    );
  });

  it("moves a handle with the arrow keys, ten steps with Shift", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Ease onChange={onChange} />);
    const start = screen.getByRole("slider", { name: "Start handle" });
    start.focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith([0.23, 1, 0.36, 1]);
    await user.keyboard("{ArrowDown}");
    expect(onChange).toHaveBeenLastCalledWith([0.23, 0.99, 0.36, 1]);
    await user.keyboard("{Shift>}{ArrowLeft}{/Shift}");
    expect(onChange).toHaveBeenLastCalledWith([0.13, 0.99, 0.36, 1]);
    const end = screen.getByRole("slider", { name: "End handle" });
    end.focus();
    await user.keyboard("{ArrowUp}");
    expect(onChange).toHaveBeenLastCalledWith([0.13, 0.99, 0.36, 1.01]);
  });

  it("keeps handles in range and reports nothing when a key changes nothing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Ease start={[1, 1.6, 0, -0.6]} onChange={onChange} />);
    screen.getByRole("slider", { name: "Start handle" }).focus();
    await user.keyboard("{ArrowRight}{ArrowUp}");
    screen.getByRole("slider", { name: "End handle" }).focus();
    await user.keyboard("{ArrowLeft}{ArrowDown}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("drags a handle to the pointer, clamped and snapped", () => {
    const onChange = vi.fn();
    render(<Ease onChange={onChange} />);
    const start = screen.getByRole("slider", { name: "Start handle" });
    const frame = start.closest("svg")!.querySelector("rect")!.getBoundingClientRect();
    // The rect is the unit square: its left edge is x 0, its bottom edge y 0.
    fireEvent.pointerDown(start, { pointerId: 1, clientX: frame.left, clientY: frame.top });
    fireEvent.pointerMove(start, {
      pointerId: 1,
      clientX: frame.left + frame.width / 2,
      clientY: frame.top + frame.height / 2,
    });
    expect(onChange).toHaveBeenLastCalledWith([0.5, 0.5, 0.36, 1]);
    // Far outside the graph: x stops at 0, y at the range's top.
    fireEvent.pointerMove(start, { pointerId: 1, clientX: -5000, clientY: -5000 });
    expect(onChange).toHaveBeenLastCalledWith([0, 1.6, 0.36, 1]);
    fireEvent.pointerUp(start, { pointerId: 1 });
    onChange.mockClear();
    fireEvent.pointerMove(start, { pointerId: 1, clientX: frame.left, clientY: frame.top });
    expect(onChange).not.toHaveBeenCalled();
  });
});
