// Tests for src/react.tsx, in Chromium.

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SeasonalEffect } from "../src/react.tsx";

describe("SeasonalEffect", () => {
  it("renders one canvas with the given size and a name, and draws on it", () => {
    const { container } = render(
      <SeasonalEffect
        name="frost"
        mode="still"
        style={{ width: 240, height: 240 }}
        label="Loading"
      />,
    );
    const canvas = container.querySelector("canvas")!;
    expect(container.querySelectorAll("canvas")).toHaveLength(1);
    expect(canvas.getAttribute("aria-label")).toBe("Loading");
    expect(canvas.clientWidth).toBe(240);
    const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
    expect(data.some((value, i) => i % 4 === 3 && value > 0)).toBe(true);
  });

  it("falls back to a name made from the effect", () => {
    const { container } = render(
      <SeasonalEffect name="aurora" mode="still" style={{ width: 100, height: 100 }} />,
    );
    expect(container.querySelector("canvas")!.getAttribute("aria-label")).toBe("aurora animation");
  });

  it("changes the picture when the flake form changes, without remounting", () => {
    const style = { width: 240, height: 240 };
    const { container, rerender } = render(
      <SeasonalEffect name="frost" mode="still" style={style} />,
    );
    const canvas = container.querySelector("canvas")!;
    const before = canvas.toDataURL();
    rerender(<SeasonalEffect name="frost" mode="still" shape="fern" style={style} />);
    expect(container.querySelector("canvas")).toBe(canvas);
    expect(canvas.toDataURL()).not.toBe(before);
  });

  it("swaps the effect when the name changes", () => {
    const style = { width: 240, height: 240 };
    const { container, rerender } = render(
      <SeasonalEffect name="frost" mode="still" style={style} />,
    );
    const before = container.querySelector("canvas")!.toDataURL();
    rerender(<SeasonalEffect name="cell-dots" mode="still" style={style} />);
    expect(container.querySelector("canvas")!.toDataURL()).not.toBe(before);
  });
});
