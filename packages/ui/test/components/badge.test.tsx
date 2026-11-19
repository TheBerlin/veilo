// Tests for src/components/badge.tsx, in Chromium with the real tokens and styles.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "../../src/components/badge.tsx";

describe("Badge", () => {
  it("renders its label in a span", () => {
    render(<Badge>How it works</Badge>);
    expect(screen.getByText("How it works").tagName).toBe("SPAN");
  });

  it("is 24 px high with the base radius", () => {
    render(<Badge>New</Badge>);
    const computed = getComputedStyle(screen.getByText("New"));
    expect(computed.height).toBe("24px");
    expect(computed.borderTopLeftRadius).toBe("8px");
  });

  it("draws the outline variant with a visible border and no fill", () => {
    render(<Badge>Outline</Badge>);
    const computed = getComputedStyle(screen.getByText("Outline"));
    expect(computed.borderTopWidth).toBe("1px");
    expect(computed.borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(computed.backgroundColor).toBe("rgba(0, 0, 0, 0)");
  });

  it("fills the solid variant with the accent color", () => {
    render(<Badge variant="solid">Solid</Badge>);
    const badge = screen.getByText("Solid");
    const accent = getComputedStyle(document.documentElement)
      .getPropertyValue("--veilo-accent")
      .trim();
    const probe = document.createElement("i");
    probe.style.color = accent;
    document.body.append(probe);
    const expected = getComputedStyle(probe).color;
    probe.remove();
    expect(getComputedStyle(badge).backgroundColor).toBe(expected);
  });

  it("passes other attributes on", () => {
    render(<Badge id="v">0.8</Badge>);
    expect(screen.getByText("0.8").id).toBe("v");
  });
});
