// Tests for src/components/chip.tsx, in Chromium with the real tokens and styles.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Chip, ChipGroup, ChipGroupItem } from "../../src/components/chip.tsx";
import { Tabs, TabsList, TabsTrigger } from "../../src/components/tabs.tsx";

/** A controlled group of three effects, as the playground uses it. */
function Effects({ onChange = () => {} }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState("shimmer");
  return (
    <ChipGroup
      aria-label="Effect"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    >
      <ChipGroupItem value="shimmer">Shimmer</ChipGroupItem>
      <ChipGroupItem value="wave">Wave</ChipGroupItem>
      <ChipGroupItem value="pulse">Pulse</ChipGroupItem>
    </ChipGroup>
  );
}

describe("Chip", () => {
  it("toggles aria-pressed and the inverted fill with Space", async () => {
    const user = userEvent.setup();
    function Lone() {
      const [on, setOn] = useState(false);
      return (
        <Chip pressed={on} onPressedChange={setOn}>
          Loop
        </Chip>
      );
    }
    render(<Lone />);
    const chip = screen.getByRole("button", { name: "Loop" });
    expect(chip.getAttribute("aria-pressed")).toBe("false");
    await user.tab();
    await user.keyboard(" ");
    expect(chip.getAttribute("aria-pressed")).toBe("true");
    expect(getComputedStyle(chip).backgroundColor).toBe("rgb(241, 241, 241)");
    expect(getComputedStyle(chip).outlineStyle).toBe("solid");
  });
});

describe("ChipGroup", () => {
  it("is a named radio group with exactly one chosen item", () => {
    render(<Effects />);
    expect(screen.getByRole("radiogroup", { name: "Effect" })).toBeTruthy();
    const chosen = screen.getAllByRole("radio").filter((item) => item.ariaChecked === "true");
    expect(chosen.map((item) => item.textContent)).toEqual(["Shimmer"]);
  });

  it("moves with arrow keys and chooses with Space", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Effects onChange={onChange} />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement?.textContent).toBe("Wave");
    await user.keyboard(" ");
    expect(onChange).toHaveBeenLastCalledWith("wave");
  });

  it("keeps the choice when the chosen item is pressed again", async () => {
    const onChange = vi.fn();
    render(<Effects onChange={onChange} />);
    await userEvent.click(screen.getByText("Shimmer"));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("Shimmer").ariaChecked).toBe("true");
  });

  it("segmented: sits in the tab bar's container, with tab-like chips", () => {
    const props = ["padding", "border", "border-radius", "background-color", "box-shadow"];
    render(
      <>
        <ChipGroup aria-label="Theme" value="light" onValueChange={() => {}} variant="segmented">
          <ChipGroupItem value="light">Light</ChipGroupItem>
          <ChipGroupItem value="dark">Dark</ChipGroupItem>
        </ChipGroup>
        <Tabs value="a">
          <TabsList aria-label="Bar">
            <TabsTrigger value="a">A</TabsTrigger>
            <TabsTrigger value="b">B</TabsTrigger>
          </TabsList>
        </Tabs>
      </>,
    );
    const style = (element: Element, names: string[]) => {
      const computed = getComputedStyle(element);
      return names.map((name) => computed.getPropertyValue(name));
    };
    const group = screen.getByRole("radiogroup", { name: "Theme" });
    expect(style(group, props)).toEqual(style(screen.getByRole("tablist"), props));
    const item = ["border-color", "background-color", "color"];
    expect(style(screen.getByRole("radio", { name: "Light" }), item)).toEqual(
      style(screen.getByRole("tab", { name: "A" }), item),
    );
    expect(style(screen.getByRole("radio", { name: "Dark" }), item)).toEqual(
      style(screen.getByRole("tab", { name: "B" }), item),
    );
  });
});
