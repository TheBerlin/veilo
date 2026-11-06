// Tests for src/components/tabs.tsx, in Chromium with the real tokens and styles.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../src/components/tabs.tsx";

/** The playground's three tabs. */
function Sections() {
  return (
    <Tabs defaultValue="loader">
      <TabsList aria-label="Sections">
        <TabsTrigger value="loader">Loader</TabsTrigger>
        <TabsTrigger value="reveal">Reveal</TabsTrigger>
        <TabsTrigger value="export">Export</TabsTrigger>
      </TabsList>
      <TabsContent value="loader">Loader settings</TabsContent>
      <TabsContent value="reveal">Reveal settings</TabsContent>
      <TabsContent value="export">Export code</TabsContent>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("shows the selected tab's panel only", () => {
    render(<Sections />);
    expect(screen.getByRole("tablist", { name: "Sections" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Loader" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").textContent).toBe("Loader settings");
  });

  it("moves and selects with arrow keys, Home and End", async () => {
    const user = userEvent.setup();
    render(<Sections />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tabpanel").textContent).toBe("Reveal settings");
    await user.keyboard("{End}");
    expect(screen.getByRole("tabpanel").textContent).toBe("Export code");
    await user.keyboard("{Home}");
    expect(screen.getByRole("tabpanel").textContent).toBe("Loader settings");
  });

  it("marks the selected tab with a fill and draws the focus ring", async () => {
    const user = userEvent.setup();
    render(<Sections />);
    await user.tab();
    const selected = getComputedStyle(screen.getByRole("tab", { name: "Loader" }));
    const other = getComputedStyle(screen.getByRole("tab", { name: "Reveal" }));
    expect(selected.backgroundColor).toBe("rgb(23, 23, 23)");
    expect(other.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(selected.outlineStyle).toBe("solid");
    expect(selected.height).toBe("40px");
  });

  it("gives the bar the medium radius: 8 px tabs plus 8 px padding", () => {
    render(<Sections />);
    const bar = getComputedStyle(screen.getByRole("tablist"));
    expect(bar.borderTopLeftRadius).toBe("16px");
    expect(bar.paddingTop).toBe("8px");
  });
});
