import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Reveal } from "../src/reveal.tsx";
import { Skeleton } from "../src/skeleton.tsx";

/** The test card's parts, as a user's component would mark them. */
function Card() {
  return (
    <>
      <h2 data-veilo-slot="title">Title</h2>
      <p data-veilo-slot="line">A line of text</p>
    </>
  );
}

/**
 * Puts a tree's server HTML in the page, as a browser receives it before any script runs.
 *
 * @param tree - The React tree.
 * @returns The host element holding the HTML.
 */
function serve(tree: ReactElement): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = renderToString(tree);
  document.body.append(host);
  return host;
}

/**
 * The skeleton look of an element: what the server and the live skeleton must agree on.
 *
 * @param element - A placeholder.
 * @returns Its computed text color, mask and background color.
 */
function look(element: Element) {
  const computed = getComputedStyle(element);
  return { color: computed.color, mask: computed.maskImage, background: computed.backgroundColor };
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("server skeleton", () => {
  it("shows the skeleton in server HTML and hands over to the live one on hydration", async () => {
    const tree = (
      <Reveal ready={false} preset="soft-pulse" data-testid="card">
        <Card />
      </Reveal>
    );
    const host = serve(tree);
    const title = host.querySelector('[data-veilo-slot="title"]') as HTMLElement;
    // Before any script: the server stylesheet already hides the text and draws line bars.
    const before = look(title);
    expect(before.color).toBe("rgba(0, 0, 0, 0)");
    expect(before.mask).not.toBe("none");

    const errors = vi.spyOn(console, "error");
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(host, tree);
    });
    // No hydration mismatch: the first client render equals the server HTML.
    expect(errors).not.toHaveBeenCalled();

    const card = host.querySelector('[data-testid="card"]') as HTMLElement;
    expect(card.querySelector("style")).toBeNull();
    expect(card.hasAttribute("data-veilo-ssr")).toBe(false);
    expect(card.getAttribute("aria-busy")).toBe("true");
    expect(title.hasAttribute("data-veilo-skeleton")).toBe(true);
    // The live skeleton looks the same, so the switch is invisible.
    expect(look(title)).toEqual(before);
    act(() => root?.unmount());
  });

  it("renders no server skeleton for content that is ready", () => {
    const html = renderToString(
      <Reveal ready>
        <Card />
      </Reveal>,
    );
    expect(html).not.toContain("<style");
    expect(html).not.toContain("data-veilo-ssr");
  });

  it("puts the style next to the child with asChild, and hands over", async () => {
    const tree = (
      <Skeleton loading asChild effect="pulse">
        <span className="avatar" style={{ display: "inline-block", width: 40, height: 40 }} />
      </Skeleton>
    );
    const host = serve(tree);
    expect(host.firstElementChild?.tagName).toBe("STYLE");
    const avatar = host.querySelector(".avatar") as HTMLElement;
    expect(avatar.hasAttribute("data-veilo-ssr")).toBe(true);
    const before = look(avatar);
    expect(before.background).not.toBe("rgba(0, 0, 0, 0)");

    const errors = vi.spyOn(console, "error");
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(host, tree);
    });
    expect(errors).not.toHaveBeenCalled();
    expect(host.querySelector("style")).toBeNull();
    expect(avatar.hasAttribute("data-veilo-ssr")).toBe(false);
    expect(avatar.hasAttribute("data-veilo-skeleton")).toBe(true);
    expect(look(avatar)).toEqual(before);
    act(() => root?.unmount());
  });
});
