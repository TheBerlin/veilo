// Tests for src/home/framework-demo.tsx, in Chromium.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FrameworkDemo } from "../../src/home/framework-demo.tsx";
import { FRAMEWORK_SNIPPETS } from "../../src/home/framework-snippets.ts";

/**
 * The panel of an example: the element that holds its code.
 *
 * @param label - The framework's label, such as "Vue".
 * @returns The panel.
 */
function panelOf(label: string): HTMLElement {
  return screen.getByLabelText(`${label} example`).closest<HTMLElement>("[class*=panel]")!;
}

/**
 * Whether a panel can be seen: `visibility` is what hides the ones not chosen.
 *
 * @param label - The framework's label.
 * @returns True when the panel is visible.
 */
const visible = (label: string) => getComputedStyle(panelOf(label)).visibility === "visible";

describe("FrameworkDemo", () => {
  it("offers the six ways in as a group of choices, React first", () => {
    render(<FrameworkDemo />);
    const group = screen.getByRole("radiogroup", { name: "Framework" });
    const radios = screen.getAllByRole("radio");
    expect(radios.map((radio) => radio.textContent)).toEqual(
      FRAMEWORK_SNIPPETS.map((item) => item.label),
    );
    expect(group.contains(radios[0]!)).toBe(true);
    expect(radios[0]!.getAttribute("aria-checked")).toBe("true");
  });

  it("shows only the chosen example, and the choice changes it", async () => {
    render(<FrameworkDemo />);
    expect(visible("React")).toBe(true);
    expect(visible("Vue")).toBe(false);
    await userEvent.click(screen.getByRole("radio", { name: "Vue" }));
    expect(visible("Vue")).toBe(true);
    expect(visible("React")).toBe(false);
  });

  it("keeps one choice always: pressing the chosen one keeps it", async () => {
    render(<FrameworkDemo />);
    await userEvent.click(screen.getByRole("radio", { name: "React" }));
    expect(screen.getByRole("radio", { name: "React" }).getAttribute("aria-checked")).toBe("true");
    expect(visible("React")).toBe(true);
  });

  it("is the same height for every choice, so nothing around it moves", async () => {
    const { container } = render(<FrameworkDemo />);
    const heights = new Set<number>();
    for (const item of FRAMEWORK_SNIPPETS) {
      await userEvent.click(screen.getByRole("radio", { name: item.label }));
      heights.add(Math.round(container.firstElementChild!.getBoundingClientRect().height));
    }
    expect(heights.size).toBe(1);
  });

  it("shows the install command under the code, except for the CDN example", async () => {
    render(<FrameworkDemo />);
    expect(screen.getByText("npm install @veilo-ui/react")).toBeTruthy();
    await userEvent.click(screen.getByRole("radio", { name: "HTML" }));
    const html = FRAMEWORK_SNIPPETS.find((item) => item.id === "html")!;
    expect(html.install).toBeNull();
    expect(screen.queryByLabelText("HTML install command")).toBeNull();
  });

  it("says the packages are not out yet", () => {
    render(<FrameworkDemo />);
    expect(screen.getByText(/arrive with the first public release/)).toBeTruthy();
  });

  it("can be used from the keyboard: arrows move focus, Enter chooses", async () => {
    render(<FrameworkDemo />);
    screen.getByRole("radio", { name: "React" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    const vue = screen.getByRole("radio", { name: "Vue" });
    expect(document.activeElement).toBe(vue);
    await userEvent.keyboard("{Enter}");
    expect(vue.getAttribute("aria-checked")).toBe("true");
    expect(visible("Vue")).toBe(true);
  });
});
