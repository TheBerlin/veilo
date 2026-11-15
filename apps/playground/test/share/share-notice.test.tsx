// Tests for src/share/share-notice.tsx: loading a link when the page opens, in Chromium.

import { defaultSettings } from "@veilo/core";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { encodeShareLink } from "../../src/share/share-link.ts";
import { LINK_ERRORS, LINK_LOADED, ShareNotice } from "../../src/share/share-notice.tsx";
import { createSettingsStore } from "../../src/state/settings-store.ts";

/**
 * Sets the address bar's fragment, keeping the test page's path and query.
 *
 * @param hash - The fragment, or `""` for none.
 */
function setHash(hash: string) {
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", pathname + search + hash);
}

/**
 * Renders the notice on a fresh store.
 *
 * @returns The store and a getter for the message.
 */
function renderNotice() {
  const store = createSettingsStore();
  const view = render(<ShareNotice store={store} />);
  const message = () => view.container.querySelector("p")!.textContent;
  return { store, message };
}

describe("ShareNotice", () => {
  afterEach(() => setHash(""));

  it("loads a link's settings, says so and removes the fragment", async () => {
    const settings = { ...defaultSettings(), effect: "pulse", imageFx: "hex" };
    setHash(await encodeShareLink({ settings }));
    const { store, message } = renderNotice();
    await waitFor(() => expect(message()).toBe(LINK_LOADED));
    expect(store.getState().settings).toEqual(settings);
    // Loading counts as a load, so the stage plays the full sequence.
    expect(store.getState().loads).toBe(1);
    expect(window.location.hash).toBe("");
    expect(screen.getByText(LINK_LOADED).getAttribute("aria-live")).toBe("polite");
  });

  it("keeps the settings and explains when the link cannot be read", async () => {
    setHash("#v1.broken");
    const { store, message } = renderNotice();
    await waitFor(() => expect(message()).toBe(LINK_ERRORS.invalid));
    expect(store.getState().settings).toEqual(defaultSettings());
    expect(store.getState().loads).toBe(0);
    expect(window.location.hash).toBe("");
  });

  it("says when a link is from a newer version", async () => {
    setHash("#v2.AAAA");
    const { message } = renderNotice();
    await waitFor(() => expect(message()).toBe(LINK_ERRORS.newer));
  });

  it("does nothing without a fragment", async () => {
    const { store, message } = renderNotice();
    // Give a decode, if one started by mistake, time to finish.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(message()).toBe("");
    expect(store.getState().loads).toBe(0);
  });
});
