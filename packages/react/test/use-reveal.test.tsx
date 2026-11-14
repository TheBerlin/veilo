import type { Reveal, RevealState } from "@veilo/core";
import { act, render } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import type { RevealConfig } from "../src/config.ts";
import { useReveal } from "../src/use-reveal.ts";

/** What the test card reports to the test on every render. */
interface Seen {
  reveal: Reveal | null;
  state: RevealState;
}

/**
 * A small card with slots, run by the hook. Reports the hook's result through `onRender`.
 *
 * @param props - The config and the report callback.
 * @returns The card.
 */
function Card(props: { config?: RevealConfig; onRender: (seen: Seen) => void }) {
  const { ref, reveal, state } = useReveal<HTMLDivElement>(props.config);
  props.onRender({ reveal, state });
  return (
    <div ref={ref} data-testid="card" style={{ width: 200 }}>
      <h2 data-veilo-slot="title">Title</h2>
      <p data-veilo-slot="line">A line of text</p>
    </div>
  );
}

/**
 * Renders a node and keeps the latest hook result.
 *
 * @param node - A function that builds the tree from the report callback.
 * @returns The render result and a getter for the latest result.
 */
function renderCard(node: (onRender: (seen: Seen) => void) => ReactNode) {
  let latest: Seen = { reveal: null, state: "idle" };
  const result = render(<>{node((seen) => (latest = seen))}</>);
  return { ...result, seen: () => latest };
}

/** Elements core adds to the document head (the skeleton stylesheet). */
const headStyles = () => document.head.querySelectorAll("style").length;

describe("useReveal", () => {
  it("creates a reveal on mount and reports its state", () => {
    const { seen } = renderCard((onRender) => <Card onRender={onRender} />);
    expect(seen().reveal).not.toBeNull();
    expect(seen().state).toBe("idle");
    act(() => seen().reveal?.showLoading());
    expect(seen().state).toBe("loading");
  });

  it("restores the page exactly on unmount", () => {
    const before = headStyles();
    const { seen, getByTestId, unmount } = renderCard((onRender) => <Card onRender={onRender} />);
    const card = getByTestId("card");
    const html = card.outerHTML;
    act(() => seen().reveal?.showLoading());
    expect(card.outerHTML).not.toBe(html);
    unmount();
    // The element is gone from the page, but the node React removed must be as it was.
    expect(card.outerHTML).toBe(html);
    expect(headStyles()).toBe(before);
  });

  it("leaves one live reveal under Strict Mode", () => {
    const before = headStyles();
    const { seen, getByTestId, unmount } = renderCard((onRender) => (
      <StrictMode>
        <Card onRender={onRender} />
      </StrictMode>
    ));
    const card = getByTestId("card");
    const html = card.outerHTML;
    act(() => seen().reveal?.showLoading());
    // One skeleton: the first reveal of the double mount was destroyed and left no stylesheet.
    expect(headStyles()).toBe(before + 1);
    expect(card.getAttribute("aria-busy")).toBe("true");
    unmount();
    expect(card.outerHTML).toBe(html);
    expect(headStyles()).toBe(before);
  });

  it("rebuilds only when the config changes by value", () => {
    let latest: Seen = { reveal: null, state: "idle" };
    const onRender = (seen: Seen) => (latest = seen);
    // A new config object on every render, as a parent writing it inline would pass.
    const card = (rDur: number) => <Card config={{ settings: { rDur } }} onRender={onRender} />;
    const { rerender } = render(card(2));
    const first = latest.reveal;
    rerender(card(2));
    expect(latest.reveal).toBe(first);
    rerender(card(3));
    expect(latest.reveal).not.toBe(first);
    expect(latest.reveal).not.toBeNull();
  });
});
