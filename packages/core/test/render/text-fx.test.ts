// Tests for src/render/text-fx.ts, from the spec's card text reveal rules.
// Runs in Chromium (see BROWSER_TESTS in vitest.config.ts), for the element checks.

import { afterEach, describe, expect, it } from "vitest";
import { mountTextOverlay } from "../../src/dom/overlay.ts";
import type { EasingFunction } from "../../src/math/easing.ts";
import {
  applyTextFxFrame,
  SCRAMBLE_CHARSETS,
  scrambleText,
  scrambleTick,
  textFxConfig,
  textFxFrame,
  typewriterText,
  type TextFxConfig,
} from "../../src/render/text-fx.ts";
import { defaultSettings } from "../../src/schema/defaults.ts";

const linear: EasingFunction = (t) => t;
const DOTS = Array.from(SCRAMBLE_CHARSETS.dots);

/** A config with linear easing and a single element, so tp = clamp(p / 0.55). */
const config = (set: Partial<TextFxConfig> = {}): TextFxConfig => ({
  textFx: "scramble",
  charset: DOTS,
  unit: "char",
  ease: linear,
  rDur: 1,
  count: 1,
  ...set,
});

/** The reveal progress at which a lone element's tp equals the given value. */
const atTp = (tp: number) => tp * 0.55;

/** Which positions of the output still match the real text. */
const resolved = (text: string, shown: string) => {
  const real = Array.from(text);
  return Array.from(shown).map((ch, i) => ch === real[i]);
};

afterEach(() => {
  document.body.replaceChildren();
});

describe("SCRAMBLE_CHARSETS", () => {
  it("match the spec", () => {
    expect(SCRAMBLE_CHARSETS).toEqual({
      hex: "0123456789ABCDEF-_.~",
      binary: "01",
      symbols: "#%&@$*+=?<>/|",
      dots: "●•∙·",
    });
  });
});

describe("scrambleTick", () => {
  it("steps every 60 ms of reveal time", () => {
    // rDur 1.2 s: p = 0.05 is 60 ms, p = 0.1 is 120 ms.
    expect(scrambleTick(0, 1.2)).toBe(0);
    expect(scrambleTick(0.049, 1.2)).toBe(0);
    expect(scrambleTick(0.05, 1.2)).toBe(1);
    expect(scrambleTick(0.1, 1.2)).toBe(2);
    expect(scrambleTick(1, 1.2)).toBe(20);
  });

  it("follows the reveal duration", () => {
    expect(scrambleTick(0.5, 0.6)).toBe(5);
    expect(scrambleTick(0.5, 3)).toBe(25);
  });
});

describe("scrambleText by character", () => {
  const text = "Buy now";

  it("scrambles every non-space character at e = 0 and keeps spaces", () => {
    const shown = scrambleText(text, 0, "char", DOTS, 0, 0);
    expect(Array.from(shown)).toHaveLength(7);
    expect(shown[3]).toBe(" ");
    for (const [i, ch] of Array.from(shown).entries()) if (i !== 3) expect(DOTS).toContain(ch);
  });

  it("shows the real text at e = 1", () => {
    expect(scrambleText(text, 1, "char", DOTS, 0, 5)).toBe(text);
  });

  it("resolves non-space character k of N exactly at e = (k + 1) / N", () => {
    // "Buy now" has 6 non-space characters; the space sits between k = 2 and k = 3.
    expect(resolved(text, scrambleText(text, 3 / 6, "char", DOTS, 0, 0))).toEqual([
      true,
      true,
      true,
      true,
      false,
      false,
      false,
    ]);
    expect(resolved(text, scrambleText(text, 3 / 6 - 1e-9, "char", DOTS, 0, 0))).toEqual([
      true,
      true,
      false,
      true,
      false,
      false,
      false,
    ]);
  });

  it("picks characters from the chosen set", () => {
    const shown = scrambleText("abcdefgh", 0, "char", Array.from(SCRAMBLE_CHARSETS.binary), 0, 0);
    expect(shown).toMatch(/^[01]{8}$/);
  });

  it("gives the same characters for the same element, position and tick", () => {
    expect(scrambleText("scrambled", 0.2, "char", DOTS, 3, 9)).toBe(
      scrambleText("scrambled", 0.2, "char", DOTS, 3, 9),
    );
  });

  it("changes characters from one tick to the next, and between elements", () => {
    const long = "x".repeat(40);
    const hexSet = Array.from(SCRAMBLE_CHARSETS.hex);
    const base = scrambleText(long, 0, "char", hexSet, 0, 0);
    expect(scrambleText(long, 0, "char", hexSet, 0, 1)).not.toBe(base);
    expect(scrambleText(long, 0, "char", hexSet, 1, 0)).not.toBe(base);
  });

  it("keeps characters outside the Basic Multilingual Plane whole", () => {
    const shown = scrambleText("a😀b", 2 / 3, "char", DOTS, 0, 0);
    expect(Array.from(shown)).toHaveLength(3);
    expect(Array.from(shown).slice(0, 2)).toEqual(["a", "😀"]);
  });

  it("returns text with no letters unchanged", () => {
    expect(scrambleText("", 0, "char", DOTS, 0, 0)).toBe("");
    expect(scrambleText("   ", 0, "char", DOTS, 0, 0)).toBe("   ");
  });
});

describe("scrambleText by word", () => {
  const text = "tri-mode  wireless shell";

  it("resolves whole words in reading order at e = (w + 1) / W", () => {
    const flags = (e: number) => resolved(text, scrambleText(text, e, "word", DOTS, 0, 0));
    const word = (from: number, to: number, value: boolean) => Array(to - from).fill(value);

    // Three words: "tri-mode" (0-7), two spaces, "wireless" (10-17), a space, "shell" (19-23).
    expect(flags(0.3)).toEqual([
      ...word(0, 8, false),
      true,
      true,
      ...word(10, 18, false),
      true,
      ...word(19, 24, false),
    ]);
    expect(flags(1 / 3)).toEqual([
      ...word(0, 8, true),
      true,
      true,
      ...word(10, 18, false),
      true,
      ...word(19, 24, false),
    ]);
    expect(flags(2 / 3)).toEqual([...word(0, 18, true), true, ...word(19, 24, false)]);
    expect(scrambleText(text, 1, "word", DOTS, 0, 0)).toBe(text);
  });
});

describe("typewriterText", () => {
  it("types round(e x length) characters", () => {
    expect(typewriterText("$59.99", 0, 0)).toBe("");
    expect(typewriterText("$59.99", 0.5, 1)).toBe("$59");
    expect(typewriterText("$59.99", 0.58, 1)).toBe("$59"); // 3.48 rounds down
    expect(typewriterText("$59.99", 0.59, 1)).toBe("$59."); // 3.54 rounds up
  });

  it("shows the caret only mid-animation", () => {
    expect(typewriterText("abcd", 0, 0)).toBe("");
    expect(typewriterText("abcd", 0.5, 0.5)).toBe("ab▍");
    expect(typewriterText("abcd", 1, 1)).toBe("abcd");
  });

  it("keeps characters outside the Basic Multilingual Plane whole", () => {
    expect(typewriterText("😀😀😀😀", 0.5, 1)).toBe("😀😀");
  });
});

describe("textFxFrame", () => {
  it("follows the element's own window on the text timeline", () => {
    // Seven elements: element 6 starts at p = 0.3 and ends at 0.85.
    const typewriter = config({ textFx: "typewriter", count: 7 });
    expect(textFxFrame(typewriter, "abcd", 6, 0.29).overlay).toBe("");
    expect(textFxFrame(typewriter, "abcd", 6, 0.575).overlay).toBe("ab▍");
    expect(textFxFrame(typewriter, "abcd", 6, 0.85).overlay).toBe("abcd");
  });

  it("scrambles with the tick from p and rDur", () => {
    const scramble = config({ rDur: 1.2 });
    const frame = textFxFrame(scramble, "hello world", 2, 0.05);
    expect(frame.overlay).toBe(scrambleText("hello world", frame.eased, "char", DOTS, 2, 1));
    expect([frame.opacity, frame.transform, frame.filter]).toEqual(["", "", ""]);
  });

  it.each([
    [0, "0", "translateY(10px)", "blur(3px)"],
    [0.5, "0.5", "translateY(5px)", "blur(1.5px)"],
    [1, "1", "translateY(0px)", "blur(0px)"],
  ])("rises and sharpens at tp = %s", (tp, opacity, transform, filter) => {
    expect(textFxFrame(config({ textFx: "rise" }), "x", 0, atTp(tp))).toEqual({
      overlay: null,
      opacity,
      transform,
      filter,
      eased: tp,
    });
  });

  it("fades with eased progress", () => {
    const quad: EasingFunction = (t) => t * t;
    const frame = textFxFrame(config({ textFx: "fade", ease: quad }), "x", 0, atTp(0.5));
    expect(frame).toEqual({
      overlay: null,
      opacity: "0.25",
      transform: "",
      filter: "",
      eased: 0.25,
    });
  });

  it("clamps overshoot easing", () => {
    const overshoot: EasingFunction = (t) => t * 1.2;
    const frame = textFxFrame(config({ textFx: "rise", ease: overshoot }), "x", 0, atTp(1));
    expect([frame.opacity, frame.transform, frame.filter, frame.eased]).toEqual([
      "1",
      "translateY(0px)",
      "blur(0px)",
      1,
    ]);
  });
});

describe("textFxConfig", () => {
  it("gathers the text settings", () => {
    const settings = {
      ...defaultSettings(),
      textFx: "typewriter",
      charset: "binary",
      unit: "word",
      rDur: 2,
      rEase: "linear",
    } as const;
    const result = textFxConfig(settings, 6);
    expect(result).toMatchObject({
      textFx: "typewriter",
      charset: ["0", "1"],
      unit: "word",
      rDur: 2,
      count: 6,
    });
    expect(result.ease(0.3)).toBeCloseTo(0.3, 5);
  });
});

describe("applyTextFxFrame", () => {
  it("writes the overlay text with textContent", () => {
    const element = document.createElement("p");
    element.textContent = "<b>x</b>";
    document.body.append(element);
    const handle = mountTextOverlay(element);
    applyTextFxFrame(
      element,
      textFxFrame(config({ textFx: "typewriter" }), "<b>x</b>", 0, atTp(1)),
      handle,
    );
    expect(handle.overlay.textContent).toBe("<b>x</b>");
    expect(handle.overlay.children).toHaveLength(0);
  });

  it("writes and then removes the element's styles", () => {
    const element = document.createElement("p");
    document.body.append(element);
    applyTextFxFrame(element, textFxFrame(config({ textFx: "rise" }), "x", 0, atTp(0.5)));
    expect([element.style.opacity, element.style.transform, element.style.filter]).toEqual([
      "0.5",
      "translateY(5px)",
      "blur(1.5px)",
    ]);
    applyTextFxFrame(element, textFxFrame(config({ textFx: "scramble" }), "x", 0, atTp(0.5)));
    expect([element.style.opacity, element.style.transform, element.style.filter]).toEqual([
      "",
      "",
      "",
    ]);
  });
});
