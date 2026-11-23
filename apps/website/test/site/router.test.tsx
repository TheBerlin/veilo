// Tests for src/site/router.tsx, in Chromium.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { isInternalNavigation, usePath } from "../../src/site/router.tsx";

function Probe() {
  const path = usePath();
  return (
    <main id="main" tabIndex={-1}>
      <p>path: {path}</p>
      <a href="/playground">Go</a>
      <a href="/playground#top">Go to a fragment</a>
      <a href="#here">Here</a>
      <a href="https://example.com/x">Away</a>
      <a href="/playground" target="_blank">
        New tab
      </a>
    </main>
  );
}

afterEach(() => history.replaceState(null, "", "/"));

describe("usePath", () => {
  it("starts on the address bar's path", () => {
    history.replaceState(null, "", "/playground/");
    render(<Probe />);
    expect(screen.getByText("path: /playground")).toBeTruthy();
  });

  it("follows a click on an internal link without loading a page, and moves focus to main", async () => {
    render(<Probe />);
    await userEvent.setup().click(screen.getByRole("link", { name: "Go" }));
    expect(screen.getByText("path: /playground")).toBeTruthy();
    expect(location.pathname).toBe("/playground");
    expect(document.activeElement?.id).toBe("main");
  });

  it("follows the back button", async () => {
    render(<Probe />);
    await userEvent.setup().click(screen.getByRole("link", { name: "Go" }));
    history.back();
    await expect.poll(() => screen.queryByText("path: /")).toBeTruthy();
  });

  it("leaves other links to the browser", () => {
    const click = (name: string, init: MouseEventInit = {}) => {
      const anchor = screen.getByRole("link", { name }) as HTMLAnchorElement;
      return isInternalNavigation(new MouseEvent("click", { button: 0, ...init }), anchor);
    };
    render(<Probe />);
    expect(click("Go")).toBe(true);
    expect(click("Away")).toBe(false);
    expect(click("New tab")).toBe(false);
    expect(click("Go", { ctrlKey: true })).toBe(false);
    expect(click("Go", { button: 1 })).toBe(false);
    // A fragment is only kept in the page when it is on the page already shown.
    expect(click("Go to a fragment")).toBe(true);
    history.replaceState(null, "", "/playground");
    expect(click("Go to a fragment")).toBe(false);
  });
});
