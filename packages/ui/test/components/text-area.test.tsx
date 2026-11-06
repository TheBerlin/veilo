// Tests for src/components/text-area.tsx, in Chromium with the real tokens and styles.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { TextArea } from "../../src/components/text-area.tsx";

/**
 * A controlled box.
 *
 * @param props - An optional hint.
 * @returns The box.
 */
function Box(props: { hint?: string }) {
  const [value, setValue] = useState("");
  return <TextArea label="Settings" value={value} onValueChange={setValue} hint={props.hint} />;
}

describe("TextArea", () => {
  it("is a textarea named by its label, with spell checking off", () => {
    render(<Box />);
    const box = screen.getByRole("textbox", { name: "Settings" });
    expect(box.tagName).toBe("TEXTAREA");
    expect(box.getAttribute("spellcheck")).toBe("false");
    expect(box.getAttribute("aria-describedby")).toBeNull();
  });

  it("reports every edit", async () => {
    render(<Box />);
    const box = screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Settings" });
    await userEvent.type(box, '{{"cols": 40}');
    expect(box.value).toBe('{"cols": 40}');
  });

  it("links its hint for screen readers", () => {
    render(<Box hint="2 settings applied." />);
    const box = screen.getByRole("textbox", { name: "Settings" });
    expect(box.getAttribute("aria-describedby")).toBeTruthy();
    expect(document.getElementById(box.getAttribute("aria-describedby")!)?.textContent).toBe(
      "2 settings applied.",
    );
  });

  it("uses the monospace code font", () => {
    render(<Box />);
    const box = screen.getByRole("textbox", { name: "Settings" });
    expect(getComputedStyle(box).fontFamily).toMatch(/Plex Mono|mono/i);
  });
});
