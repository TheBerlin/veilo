import { act, render } from "@testing-library/react";
import { StrictMode, forwardRef, type HTMLAttributes } from "react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "../src/skeleton.tsx";

/** Elements core adds to the document head (the skeleton stylesheet). */
const headStyles = () => document.head.querySelectorAll("style").length;

describe("Skeleton", () => {
  it("turns the slots inside a container into placeholders while loading", () => {
    const { getByTestId } = render(
      <Skeleton loading effect="wave" data-testid="container">
        <h2 data-veilo-slot="title">Title</h2>
        <p data-veilo-slot="line">A line of text</p>
      </Skeleton>,
    );
    const container = getByTestId("container");
    expect(container.getAttribute("aria-busy")).toBe("true");
    for (const slot of container.querySelectorAll("[data-veilo-slot]")) {
      expect(slot.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("restores the elements exactly when loading ends and on unmount", () => {
    const before = headStyles();
    const tree = (loading: boolean) => (
      <Skeleton loading={loading} data-testid="container">
        <p data-veilo-slot="line">A line of text</p>
      </Skeleton>
    );
    const { getByTestId, rerender, unmount } = render(tree(false));
    const container = getByTestId("container");
    const html = container.outerHTML;
    rerender(tree(true));
    expect(container.outerHTML).not.toBe(html);
    rerender(tree(false));
    expect(container.outerHTML).toBe(html);
    rerender(tree(true));
    unmount();
    expect(container.outerHTML).toBe(html);
    expect(headStyles()).toBe(before);
  });

  it("puts the loader on the single child with asChild, adding no element", () => {
    const { container } = render(
      <Skeleton loading asChild>
        <span data-testid="avatar" className="avatar" />
      </Skeleton>,
    );
    const avatar = container.firstElementChild as HTMLElement;
    expect(avatar.dataset.testid).toBe("avatar");
    expect(avatar.className).toBe("avatar");
    expect(avatar.getAttribute("aria-hidden")).toBe("true");
    expect(avatar.style.getPropertyValue("--i")).toBe("0");
  });

  it("keeps the child's own ref with asChild", () => {
    let own: HTMLElement | null = null;
    const Avatar = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>((props, ref) => (
      <span {...props} ref={ref} />
    ));
    render(
      <Skeleton loading asChild>
        <Avatar data-testid="avatar" ref={(element) => (own = element)} />
      </Skeleton>,
    );
    expect(own).not.toBeNull();
    expect((own as HTMLElement | null)?.getAttribute("aria-hidden")).toBe("true");
  });

  it("leaves one stylesheet under Strict Mode", () => {
    const before = headStyles();
    const { unmount } = render(
      <StrictMode>
        <Skeleton loading>
          <p data-veilo-slot="line">Text</p>
        </Skeleton>
      </StrictMode>,
    );
    expect(headStyles()).toBe(before + 1);
    act(() => unmount());
    expect(headStyles()).toBe(before);
  });
});
