// Tests for src/home/demo-readout.tsx.

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DemoReadout, readoutLabel } from "../../src/home/demo-readout.tsx";

describe("readoutLabel", () => {
  it("names each state, with the progress while revealing", () => {
    expect(readoutLabel("loading", 0)).toBe("Loading");
    expect(readoutLabel("idle", 0)).toBe("Loading");
    expect(readoutLabel("revealing", 0.424)).toBe("Revealing 42%");
    expect(readoutLabel("revealing", 0.05)).toBe("Revealing  5%");
    expect(readoutLabel("revealed", 1)).toBe("Revealed");
  });
});

describe("DemoReadout", () => {
  it("shows Loading without a reveal, and is hidden from screen readers", () => {
    const { container } = render(<DemoReadout reveal={null} />);
    expect((container.firstElementChild as HTMLElement).getAttribute("aria-hidden")).toBe("true");
    expect(container.textContent).toContain("Loading");
  });
});

describe("DemoReadout state", () => {
  it("starts as idle in data-demo-state, which the hero tests read", () => {
    const { container } = render(<DemoReadout reveal={null} />);
    expect((container.firstElementChild as HTMLElement).dataset.demoState).toBe("idle");
  });
});
