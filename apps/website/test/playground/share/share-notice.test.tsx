// Tests for src/share/share-notice.tsx: loading a link when the page opens, in Chromium.

import { defaultSettings } from "@veilo-ui/core";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Toaster, toast } from "@veilo-ui/ui";
import { afterEach, describe, expect, it } from "vitest";
import { encodeShareLink } from "../../../src/playground/share/share-link.ts";
import { LINK_ERRORS, LINK_LOADED, ShareNotice } from "../../../src/playground/share/share-notice.tsx";
import { createContentStore } from "../../../src/playground/state/content-store.ts";
import { createSettingsStore } from "../../../src/playground/state/settings-store.ts";

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
 * Renders the notice on a fresh store, with the toaster that shows its message.
 *
 * @returns The store, the content store and a getter for the message's text (`""` when none).
 */
function renderNotice() {
  const store = createSettingsStore();
  // Starts on a non-default ratio, so loading a link's (or the default) content shows.
  const content = createContentStore({ ratio: "3:2" });
  render(
    <>
      <Toaster />
      <ShareNotice store={store} content={content} />
    </>,
  );
  const message = () => document.querySelector("[data-sonner-toast]")?.textContent ?? "";
  return { store, content, message };
}

describe("ShareNotice", () => {
  afterEach(() => {
    setHash("");
    toast.dismiss();
  });

  it("loads a link's settings, says so and removes the fragment", async () => {
    const settings = { ...defaultSettings(), effect: "pulse", imageFx: "hex" };
    setHash(await encodeShareLink({ settings }));
    const { store, message } = renderNotice();
    await waitFor(() => expect(message()).toContain(LINK_LOADED));
    expect(store.getState().settings).toEqual(settings);
    // Loading counts as a load, so the stage plays the full sequence.
    expect(store.getState().loads).toBe(1);
    expect(window.location.hash).toBe("");
    // The message is in Sonner's polite live region.
    expect(screen.getByText(LINK_LOADED).closest("[aria-live]")?.getAttribute("aria-live")).toBe(
      "polite",
    );
  });

  it("loads a link's image ratio, and the default from a link made without one", async () => {
    setHash(await encodeShareLink({ settings: defaultSettings(), content: { ratio: "16:9" } }));
    const first = renderNotice();
    await waitFor(() => expect(first.content.getState().content.ratio).toBe("16:9"));
    cleanup();
    setHash(await encodeShareLink({ settings: defaultSettings() }));
    const second = renderNotice();
    await waitFor(() => expect(second.message()).toContain(LINK_LOADED));
    expect(second.content.getState().content.ratio).toBe("1:1");
  });

  it("keeps the settings and explains when the link cannot be read", async () => {
    setHash("#v1.broken");
    const { store, content, message } = renderNotice();
    await waitFor(() => expect(message()).toContain(LINK_ERRORS.invalid));
    expect(store.getState().settings).toEqual(defaultSettings());
    expect(store.getState().loads).toBe(0);
    expect(content.getState().content.ratio).toBe("3:2");
    expect(window.location.hash).toBe("");
  });

  it("says when a link is from a newer version", async () => {
    setHash("#v2.AAAA");
    const { message } = renderNotice();
    await waitFor(() => expect(message()).toContain(LINK_ERRORS.newer));
  });

  it("does nothing without a fragment", async () => {
    const { store, message } = renderNotice();
    // Give a decode, if one started by mistake, time to finish.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(message()).toBe("");
    expect(store.getState().loads).toBe(0);
  });
});
