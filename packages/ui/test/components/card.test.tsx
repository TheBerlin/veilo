// Tests for src/components/card.tsx, in Chromium with the real tokens and styles.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "../../src/components/card.tsx";

/** Reads computed style values of an element. */
function style(element: Element, names: string[]) {
  const computed = getComputedStyle(element);
  return names.map((name) => computed.getPropertyValue(name));
}

describe("Card", () => {
  it("renders its children in a div by default, or the element asked for", () => {
    render(
      <>
        <Card data-testid="plain">One</Card>
        <Card as="article" data-testid="article">
          Two
        </Card>
      </>,
    );
    expect(screen.getByTestId("plain").tagName).toBe("DIV");
    expect(screen.getByTestId("article").tagName).toBe("ARTICLE");
    expect(screen.getByText("One")).toBeTruthy();
  });

  it("card: 16 px padding, 24 px radius, a hairline border, no shadow", () => {
    render(<Card data-testid="card">Content</Card>);
    const [padding, radius, border, shadow] = style(screen.getByTestId("card"), [
      "padding-top",
      "border-top-left-radius",
      "border-top-width",
      "box-shadow",
    ]);
    expect([padding, radius, border, shadow]).toEqual(["16px", "24px", "1px", "none"]);
  });

  it("panel: 32 px padding and a 40 px radius", () => {
    render(
      <Card size="panel" data-testid="panel">
        Content
      </Card>,
    );
    expect(style(screen.getByTestId("panel"), ["padding-top", "border-top-left-radius"])).toEqual([
      "32px",
      "40px",
    ]);
  });

  it("raised adds the soft shadow", () => {
    render(
      <Card raised data-testid="raised">
        Content
      </Card>,
    );
    expect(getComputedStyle(screen.getByTestId("raised")).boxShadow).not.toBe("none");
  });

  it("passes other attributes and a class through", () => {
    render(
      <Card aria-label="Product" className="extra" data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByLabelText("Product").classList.contains("extra")).toBe(true);
  });
});
