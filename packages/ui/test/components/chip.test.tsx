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
    expect(getComputedStyle(chip).backgroundColor).toBe("rgb(226, 226, 231)");
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
    // The chosen chip is transparent; the sliding pill under it carries the tab's selected fill.
    const pill = group.querySelector("span[aria-hidden]") as Element;
    const fill = ["border-color", "background-color"];
    expect(style(pill, fill)).toEqual(style(screen.getByRole("tab", { name: "A" }), fill));
    expect(style(screen.getByRole("radio", { name: "Light" }), ["color"])).toEqual(
      style(screen.getByRole("tab", { name: "A" }), ["color"]),
    );
    const item = ["border-color", "background-color", "color"];
    expect(style(screen.getByRole("radio", { name: "Dark" }), item)).toEqual(
      style(screen.getByRole("tab", { name: "B" }), item),
    );
  });

  it("segmented: the pill sits under the chosen chip and follows a change", async () => {
    function Bar() {
      const [value, setValue] = useState("light");
      return (
        <ChipGroup aria-label="Theme" value={value} onValueChange={setValue} variant="segmented">
          <ChipGroupItem value="light">Light</ChipGroupItem>
          <ChipGroupItem value="dark">Dark</ChipGroupItem>
        </ChipGroup>
      );
    }
    render(<Bar />);
    const group = screen.getByRole("radiogroup", { name: "Theme" });
    const pill = group.querySelector("span[aria-hidden]") as HTMLElement;
    const overlap = (chip: HTMLElement) => {
      const a = pill.getBoundingClientRect();
      const b = chip.getBoundingClientRect();
      return (
        Math.abs(a.left - b.left) < 1 &&
        Math.abs(a.width - b.width) < 1 &&
        Math.abs(a.top - b.top) < 1
      );
    };
    expect(overlap(screen.getByRole("radio", { name: "Light" }))).toBe(true);
    await userEvent.click(screen.getByRole("radio", { name: "Dark" }));
    // Durations are 0 in tests, so the move is immediate.
    await vi.waitFor(() => expect(overlap(screen.getByRole("radio", { name: "Dark" }))).toBe(true));
  });
});
