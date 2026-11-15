// Tests for src/share/share-link.ts: the `#v1.` link format, in Node (CompressionStream, atob
// and btoa are globals there too).

import { defaultSettings } from "@veilo/core";
import { describe, expect, it } from "vitest";
import {
  decodeShareLink,
  encodeShareLink,
  SHARE_LIMITS,
  shareUrl,
} from "../../src/share/share-link.ts";
import { createSettingsStore } from "../../src/state/settings-store.ts";

/**
 * Builds a `#v1.` fragment from any text, to test what the decoder does with payloads the
 * encoder would never write.
 *
 * @param text - The text to compress.
 * @returns The fragment.
 */
async function fragmentOf(text: string): Promise<string> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  const binary = String.fromCharCode(...bytes);
  return `#v1.${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}

describe("encodeShareLink and decodeShareLink", () => {
  it("round-trip the default settings and a custom color", async () => {
    const settings = { ...defaultSettings(), effect: "wave", inkColor: "#ff8800" };
    const fragment = await encodeShareLink({ settings });
    expect(await decodeShareLink(fragment)).toEqual({ ok: true, payload: { settings } });
    // Also without the leading #.
    expect(await decodeShareLink(fragment.slice(1))).toEqual({ ok: true, payload: { settings } });
  });

  it("carry the preview content when given, and read links without it", async () => {
    const settings = defaultSettings();
    const withContent = await encodeShareLink({ settings, content: { ratio: "16:9" } });
    expect(await decodeShareLink(withContent)).toEqual({
      ok: true,
      payload: { settings, content: { ratio: "16:9" } },
    });
    // A link from before content existed has no content field at all.
    const old = await encodeShareLink({ settings });
    expect(await decodeShareLink(old)).toEqual({ ok: true, payload: { settings } });
  });

  it("write a short fragment of URL-safe characters only", async () => {
    const fragment = await encodeShareLink({ settings: defaultSettings() });
    expect(fragment).toMatch(/^#v1\.[A-Za-z0-9_-]+$/);
    // Budget for the full default settings; measured at 330 characters when written.
    expect(fragment.length).toBeLessThan(500);
  });

  it("reject fragments that are not links", async () => {
    for (const hash of ["", "#", "#v1.", "#v0.abc", "#abc", "#v1.!!!", "#v1.A", "#v1.AAAA"]) {
      expect(await decodeShareLink(hash), hash).toEqual({ ok: false, error: "invalid" });
    }
  });

  it("say when a link comes from a later format", async () => {
    expect(await decodeShareLink("#v2.AAAA")).toEqual({ ok: false, error: "newer" });
    expect(await decodeShareLink("#v10.AAAA")).toEqual({ ok: false, error: "newer" });
  });

  it("reject payloads that do not parse or have no settings object", async () => {
    for (const text of ["not json", "[]", "null", "{}", '{"settings":null}', '{"settings":[]}']) {
      expect(await decodeShareLink(await fragmentOf(text)), text).toEqual({
        ok: false,
        error: "invalid",
      });
    }
    // Bytes that are not UTF-8.
    const bad = `#v1.${btoa(String.fromCharCode(0xff, 0xfe)).replace(/=+$/, "")}`;
    expect(await decodeShareLink(bad)).toEqual({ ok: false, error: "invalid" });
  });

  it("reject data past the limits, including a small link that inflates too far", async () => {
    expect(await decodeShareLink(`#v1.${"A".repeat(SHARE_LIMITS.data + 4)}`)).toEqual({
      ok: false,
      error: "invalid",
    });
    const padded = JSON.stringify({ settings: {}, pad: " ".repeat(SHARE_LIMITS.json) });
    const fragment = await fragmentOf(padded);
    expect(fragment.length).toBeLessThan(SHARE_LIMITS.data);
    expect(await decodeShareLink(fragment)).toEqual({ ok: false, error: "invalid" });
  });

  it("leave checking to the store, which clamps a tampered value", async () => {
    const fragment = await fragmentOf('{"settings":{"lDur":999,"effect":"nope"}}');
    const result = await decodeShareLink(fragment);
    expect(result).toEqual({ ok: true, payload: { settings: { lDur: 999, effect: "nope" } } });
    const store = createSettingsStore();
    if (result.ok) store.getState().load(result.payload.settings);
    expect(store.getState().settings.lDur).toBeLessThan(999);
    expect(store.getState().settings.effect).toBe(defaultSettings().effect);
  });
});

describe("shareUrl", () => {
  it("joins the page address and the fragment, without the query", () => {
    const location = { origin: "https://veilo.test", pathname: "/play/" };
    expect(shareUrl(location, "#v1.abc")).toBe("https://veilo.test/play/#v1.abc");
  });
});
