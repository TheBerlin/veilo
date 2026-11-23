// Tests for src/components/button.tsx, in Chromium with the real tokens and styles.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { userEvent as realUser } from "vitest/browser";
import { Button } from "../../src/components/button.tsx";

const icon = <svg aria-hidden="true" viewBox="0 0 24 24" />;

describe("Button", () => {
  it("is a non-submitting button with its label", () => {
    render(<Button>Open Playground</Button>);
    const button = screen.getByRole("button", { name: "Open Playground" });
    expect(button.getAttribute("type")).toBe("button");
  });

  it("runs onClick from the mouse, Enter and Space", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Copy</Button>);
    await user.tab();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it("ignores clicks when disabled and fades to 0.4", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Export
      </Button>,
    );
    const button = screen.getByRole("button");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(getComputedStyle(button).opacity).toBe("0.4");
  });

  it("draws the accent focus ring only for keyboard focus", async () => {
    const user = userEvent.setup();
    render(<Button variant="primary">Open Playground</Button>);
    const button = screen.getByRole("button");
    await user.tab();
    expect(document.activeElement).toBe(button);
    const style = getComputedStyle(button);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
    // Dark is the default theme, so the accent is #e2e2e7.
    expect(style.outlineColor).toBe("rgb(226, 226, 231)");
  });

  it("uses the design system's sizes and the control radius", () => {
    render(
      <>
        <Button size="sm">Small</Button>
        <Button>Medium</Button>
        <Button size="lg">Large</Button>
      </>,
    );
    const heights = screen.getAllByRole("button").map((b) => getComputedStyle(b).height);
    expect(heights).toEqual(["32px", "44px", "52px"]);
    expect(getComputedStyle(screen.getByText("Medium")).borderTopLeftRadius).toBe("8px");
  });

  it("gives the primary variant the accent fill and the secondary an outline", () => {
    render(
      <>
        <Button variant="primary">Primary</Button>
        <Button>Secondary</Button>
      </>,
    );
    expect(getComputedStyle(screen.getByText("Primary")).backgroundColor).toBe(
      "rgb(226, 226, 231)",
    );
    expect(getComputedStyle(screen.getByText("Secondary")).borderTopColor).toBe(
      "rgb(114, 113, 126)",
    );
  });

  it("makes icon-only buttons square and named by their label", () => {
    render(<Button iconOnly aria-label="Close" icon={icon} size="sm" />);
    const button = screen.getByRole("button", { name: "Close" });
    const style = getComputedStyle(button);
    expect([style.width, style.height]).toEqual(["32px", "32px"]);
  });

  it("renders a link with the button look through asChild", () => {
    render(
      <Button asChild variant="primary">
        <a href="/playground">Open Playground</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Open Playground" });
    expect(link.getAttribute("type")).toBeNull();
    expect(getComputedStyle(link).height).toBe("44px");
  });

  it("shows the pressed look with data-pressed, as for a real press, and not when disabled", () => {
    render(
      <>
        <Button data-testid="rest">Rest</Button>
        <Button data-testid="pressed" data-pressed="true">
          Pressed
        </Button>
        <Button data-testid="disabled" data-pressed="true" disabled>
          Disabled
        </Button>
      </>,
    );
    expect(getComputedStyle(screen.getByTestId("rest")).transform).toBe("none");
    expect(getComputedStyle(screen.getByTestId("pressed")).transform).toBe(
      "matrix(1, 0, 0, 1, 0, 1)",
    );
    expect(getComputedStyle(screen.getByTestId("disabled")).transform).toBe("none");
  });

  it.each(["primary", "secondary", "ghost"] as const)(
    "%s: a pressed button looks like a hovered one, pressed down by 1 px",
    async (variant) => {
      render(
        <>
          <Button variant={variant} data-testid="hovered">
            Hover me
          </Button>
          <Button variant={variant} data-testid="pressed" data-pressed="true">
            Pressed
          </Button>
          <Button variant={variant} data-testid="rest">
            Rest
          </Button>
        </>,
      );
      const look = (id: string) => {
        const computed = getComputedStyle(screen.getByTestId(id));
        return ["border-top-color", "background-color", "color", "opacity"].map((name) =>
          computed.getPropertyValue(name),
        );
      };
      const rest = look("rest");
      // A real pointer over the button, so the browser applies :hover.
      await realUser.hover(screen.getByTestId("hovered"));
      expect(look("hovered")).toEqual(look("pressed"));
      // The hover effect is real: it differs from the resting look.
      expect(look("hovered")).not.toEqual(rest);
      expect(getComputedStyle(screen.getByTestId("pressed")).transform).toBe(
        "matrix(1, 0, 0, 1, 0, 1)",
      );
    },
  );
});
