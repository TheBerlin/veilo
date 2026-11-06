// Tests for src/components/select.tsx, in Chromium with the real tokens and styles.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Select } from "../../src/components/select.tsx";

const ORIGINS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "random", label: "Random" },
];

/** A controlled origin select. */
function Origin() {
  const [value, setValue] = useState("left");
  return <Select label="Origin" value={value} onValueChange={setValue} options={ORIGINS} />;
}

describe("Select", () => {
  it("is a native select named by its label", () => {
    render(<Origin />);
    const select = screen.getByRole("combobox", { name: "Origin" }) as HTMLSelectElement;
    expect(select.tagName).toBe("SELECT");
    expect(select.value).toBe("left");
    expect([...select.options].map((o) => o.text)).toEqual(["Left", "Center", "Random"]);
  });

  it("reports the chosen value", async () => {
    render(<Origin />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    await userEvent.selectOptions(select, "random");
    expect(select.value).toBe("random");
  });

  it("uses the control outline, radius and focus ring", async () => {
    const user = userEvent.setup();
    render(<Origin />);
    await user.tab();
    const style = getComputedStyle(screen.getByRole("combobox"));
    expect(style.borderTopColor).toBe("rgb(107, 107, 107)");
    expect(style.borderTopLeftRadius).toBe("8px");
    expect(style.height).toBe("32px");
    expect(style.outlineStyle).toBe("solid");
  });
});
