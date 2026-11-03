// Tests for src/controller/targets.ts. Runs in Chromium (see BROWSER_TESTS in vitest.config.ts).

import { afterEach, describe, expect, it, vi } from "vitest";
import { isContainer, resolveTargets } from "../../src/controller/targets.ts";

/** Builds markup in a fresh container. */
function markup(html: string) {
  const container = document.createElement("article");
  container.innerHTML = html;
  document.body.append(container);
  return container;
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("isContainer", () => {
  it("tells an element from a targets object", () => {
    expect(isContainer(document.createElement("div"))).toBe(true);
    expect(isContainer({ text: [] })).toBe(false);
    expect(isContainer({})).toBe(false);
  });
});

describe("resolveTargets with explicit targets", () => {
  it("keeps the targets and lists them once as placeholders", () => {
    const image = document.createElement("canvas");
    const title = document.createElement("h3");
    const button = document.createElement("button");
    const result = resolveTargets({ image, text: [title, button], button }, { cols: 20 }, false);
    expect(result.targets).toEqual({ image, text: [title, button], button });
    expect(result.placeholders).toEqual([image, title, button]);
    expect(result.settings.cols).toBe(20);
    expect(result.container).toBeUndefined();
  });

  it("also reads the settings out of a layout", () => {
    expect(resolveTargets({}, { settings: { cols: 20 } }, false).settings.cols).toBe(20);
  });
});

describe("resolveTargets with a container", () => {
  const CARD = `
    <span data-veilo-slot="badge">New</span>
    <img data-veilo-slot="photo">
    <h3 data-veilo-slot="title">T</h3>
    <button data-veilo-slot="buy"><span data-veilo-slot="label">Buy</span></button>`;

  it("builds targets from roles, and shows the skeleton on every slot", () => {
    const container = markup(CARD);
    const result = resolveTargets(
      container,
      { settings: { cols: 20 }, slots: { badge: { role: "block" } } },
      false,
    );
    const $ = (name: string) => container.querySelector(`[data-veilo-slot="${name}"]`);
    expect(result.targets.image).toBe($("photo"));
    expect(result.targets.text).toEqual([$("title"), $("label")]);
    expect(result.targets.button).toBe($("buy"));
    expect(result.placeholders).toEqual([$("badge"), $("photo"), $("title"), $("buy"), $("label")]);
    expect(result.container).toBe(container);
    expect(result.settings.cols).toBe(20);
  });

  it("leaves the targets empty when there are no slots", () => {
    const result = resolveTargets(markup("<p>no slots</p>"), {}, false);
    expect(result.targets).toEqual({ image: undefined, text: [], button: undefined });
    expect(result.placeholders).toEqual([]);
  });

  it("prints mismatches only when warnings are on", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const input = { slots: { missing: {} } };
    resolveTargets(markup(CARD), input, false);
    expect(warn).not.toHaveBeenCalled();
    resolveTargets(markup(CARD), input, true);
    expect(warn.mock.calls.map(([message]) => message)).toContain(
      'Veilo: slot "missing" is in the layout but not in the markup; it is skipped.',
    );
  });
});
