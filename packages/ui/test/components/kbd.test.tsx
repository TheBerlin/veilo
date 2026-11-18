// Tests for src/components/kbd.tsx, in Chromium with the real tokens and styles.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../../src/components/button.tsx";
import { Kbd } from "../../src/components/kbd.tsx";

describe("Kbd", () => {
  it("renders the key name in a <kbd> element", () => {
    render(<Kbd>R</Kbd>);
    expect(screen.getByText("R").tagName).toBe("KBD");
  });

  it("is a 20 px high keycap with a hairline outline and the base radius", () => {
    render(<Kbd>R</Kbd>);
    const computed = getComputedStyle(screen.getByText("R"));
    expect(computed.height).toBe("20px");
    expect(computed.borderTopWidth).toBe("1px");
    expect(computed.borderTopLeftRadius).toBe("8px");
  });

  it("is at least as wide as it is high, so a single letter is square", () => {
    render(<Kbd>R</Kbd>);
    expect(screen.getByText("R").getBoundingClientRect().width).toBeGreaterThanOrEqual(20);
  });

  it("sits in a button next to its label without changing the button's name when it is labelled", () => {
    render(
      <Button size="sm" aria-label="Replay" aria-keyshortcuts="r">
        Replay <Kbd>R</Kbd>
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Replay" });
    expect(button.getAttribute("aria-keyshortcuts")).toBe("r");
    expect(button.querySelector("kbd")).toBeTruthy();
  });

  it("passes a class and other attributes through", () => {
    render(
      <Kbd className="extra" data-testid="key">
        Esc
      </Kbd>,
    );
    expect(screen.getByTestId("key").classList.contains("extra")).toBe(true);
  });
});
