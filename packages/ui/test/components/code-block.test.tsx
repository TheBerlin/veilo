// Tests for src/components/code-block.tsx, in Chromium with the real tokens and styles.

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { CodeBlock, COPIED_MS } from "../../src/components/code-block.tsx";

const COMMAND = "pnpm add @veilo-ui/css";

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

  describe("narrow", () => {
    afterEach(async () => {
      await page.viewport(414, 896);
    });

    /**
     * Where the copy button and the code are, and how the code wraps.
     *
     * @param narrow - The prop to pass, if any.
     * @returns The layout facts.
     */
    function layoutOf(narrow?: "scroll" | "wrap") {
      render(<CodeBlock code={"a long line ".repeat(12)} narrow={narrow} aria-label="Example" />);
      const pre = screen.getByLabelText("Example");
      const copy = screen.getByRole("button", { name: "Copy" });
      return {
        whiteSpace: getComputedStyle(pre).whiteSpace,
        copyAbove: copy.getBoundingClientRect().bottom <= pre.getBoundingClientRect().top,
        copySide: copy.getBoundingClientRect().left >= pre.getBoundingClientRect().right,
        codeWidth: pre.getBoundingClientRect().width,
        blockWidth: pre.parentElement!.getBoundingClientRect().width,
      };
    }

    it("wrap: on a phone the button goes above the code, which wraps across the whole block", async () => {
      await page.viewport(375, 800);
      const layout = layoutOf("wrap");
      expect(layout.whiteSpace).toBe("pre-wrap");
      expect(layout.copyAbove).toBe(true);
      // The code is the block's width less its padding, not narrowed by a button beside it.
      expect(layout.codeWidth).toBeGreaterThan(layout.blockWidth - 40);
    });

    it("wrap: on a wide screen it still scrolls, with the button beside the code", async () => {
      await page.viewport(1440, 900);
      const layout = layoutOf("wrap");
      expect(layout.whiteSpace).toBe("pre");
      expect(layout.copySide).toBe(true);
    });

    it("scroll (the default): on a phone it keeps scrolling with the button beside the code", async () => {
      await page.viewport(375, 800);
      for (const narrow of [undefined, "scroll"] as const) {
        const layout = layoutOf(narrow);
        expect(layout.whiteSpace).toBe("pre");
        expect(layout.copySide).toBe(true);
        document.body.replaceChildren();
      }
    });
  });
});
