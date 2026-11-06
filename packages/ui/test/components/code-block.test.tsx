// Tests for src/components/code-block.tsx, in Chromium with the real tokens and styles.

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CodeBlock, COPIED_MS } from "../../src/components/code-block.tsx";

const COMMAND = "pnpm add @veilo/css";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("CodeBlock", () => {
  it("shows the code with a prompt that is not part of the text", () => {
    render(<CodeBlock code={COMMAND} prompt aria-label="Install command" />);
    expect(screen.getByText(COMMAND).tagName).toBe("CODE");
    expect(screen.getByText("$").getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByLabelText("Install command").tagName).toBe("PRE");
  });

  it("copies the code, says Copied, and returns to Copy after 1.6 s", async () => {
    const write = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    render(<CodeBlock code={COMMAND} prompt />);
    vi.useFakeTimers();
    await act(async () => screen.getByRole("button", { name: "Copy" }).click());
    expect(write).toHaveBeenCalledWith(COMMAND);
    expect(screen.getByRole("button").textContent).toBe("Copied");
    expect(screen.getByRole("status").textContent).toBe("Copied to the clipboard");
    expect(getComputedStyle(screen.getByRole("button")).color).toBe("rgb(127, 200, 160)");
    act(() => vi.advanceTimersByTime(COPIED_MS));
    expect(screen.getByRole("button").textContent).toBe("Copy");
  });

  it("selects the code and says Press Ctrl+C when the clipboard is blocked", async () => {
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("blocked"));
    render(<CodeBlock code={COMMAND} />);
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(screen.getByRole("button").textContent).toBe("Press Ctrl+C");
    expect(window.getSelection()?.toString()).toBe(COMMAND);
  });

  it("never wraps and scrolls long lines inside the block", () => {
    render(
      <div style={{ width: 240 }}>
        <CodeBlock code={"x".repeat(200)} />
      </div>,
    );
    const pre = screen.getByText("x".repeat(200)).parentElement as HTMLElement;
    expect(getComputedStyle(pre).whiteSpace).toBe("pre");
    expect(pre.scrollWidth).toBeGreaterThan(pre.clientWidth);
    expect(pre.tabIndex).toBe(0);
  });

  it("stays as wide as its grid cell instead of growing to its longest line", () => {
    render(
      <div style={{ display: "grid", width: 240 }}>
        <CodeBlock code={"x".repeat(200)} />
      </div>,
    );
    const pre = screen.getByText("x".repeat(200)).parentElement as HTMLElement;
    const block = pre.parentElement as HTMLElement;
    expect(block.getBoundingClientRect().width).toBeLessThanOrEqual(240);
    expect(
      screen.getByRole("button", { name: "Copy" }).getBoundingClientRect().right,
    ).toBeLessThanOrEqual(240 + 1);
  });

  it("uses the medium radius and the focus ring on the copy button", async () => {
    const user = userEvent.setup();
    render(<CodeBlock code={COMMAND} />);
    await user.tab();
    await user.tab();
    const block = screen.getByRole("button").parentElement as HTMLElement;
    expect(getComputedStyle(block).borderTopLeftRadius).toBe("16px");
    expect(getComputedStyle(screen.getByRole("button")).outlineStyle).toBe("solid");
  });
});
