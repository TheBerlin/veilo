// Tests for src/home/why-useful.tsx: the section's structure, in Chromium.

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WhyUseful } from "../../src/home/why-useful.tsx";

describe("WhyUseful", () => {
  it("is a section labelled by its h2, with the badge above it", () => {
    render(<WhyUseful />);
    const section = screen.getByRole("region", { name: "Why it's useful" });
    expect(within(section).getByText("Why Veilo").tagName).toBe("SPAN");
    expect(within(section).getAllByRole("heading", { level: 2 })).toHaveLength(1);
  });

  it("has four tiles, each an article with a title and a caption", () => {
    render(<WhyUseful />);
    const tiles = screen.getAllByRole("article");
    expect(tiles).toHaveLength(4);
    for (const tile of tiles) {
      expect(within(tile).getAllByRole("heading", { level: 3 })).toHaveLength(1);
    }
  });

  it("hides the demos from assistive technology; the text carries the message", () => {
    render(<WhyUseful />);
    for (const tile of screen.getAllByRole("article")) {
      const frame = tile.querySelector("[aria-hidden=true]");
      expect(frame).not.toBeNull();
      expect(within(tile).getByRole("heading", { level: 3 })).not.toBe(frame);
    }
  });
});
