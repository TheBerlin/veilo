// Tests for src/render/image-fx.ts, from the spec's non-grid image effects table.
// Runs in Chromium (see BROWSER_TESTS in vitest.config.ts), so the CSS is checked by a real parser.

import { afterEach, describe, expect, it } from "vitest";
import type { EasingFunction } from "../../src/math/easing.ts";
import {
  applyImageFxFrame,
  imageFxFrame,
  isImageFxStyle,
  type ImageFxFrame,
  type ImageFxStyle,
} from "../../src/render/image-fx.ts";
import type { Settings } from "../../src/schema/types.ts";

type Origin = Settings["origin"];

const linear: EasingFunction = (t) => t;
// Overshoots to 1.2 at p = 1, like the `back` curve does mid-way.
const overshoot: EasingFunction = (t) => t * 1.2;

const ORIGINS: Origin[] = ["left", "right", "top", "bottom", "center", "diagonal", "random"];
const STYLES: ImageFxStyle[] = ["crossfade", "blur", "zoom", "wipe"];

/** A frame with only the given properties set. */
const frame = (set: Partial<ImageFxFrame>): ImageFxFrame => ({
  opacity: "",
  filter: "",
  transform: "",
  clipPath: "",
  ...set,
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("isImageFxStyle", () => {
  it("is true for the four effects without a grid only", () => {
    const all: Settings["imageFx"][] = [
      "dots",
      "hex",
      "binary",
      "mosaic",
      "blur",
      "crossfade",
      "wipe",
      "zoom",
    ];
    expect(all.filter(isImageFxStyle)).toEqual(["blur", "crossfade", "wipe", "zoom"]);
  });
});

describe("imageFxFrame effects", () => {
  it.each([
    [0, "0"],
    [0.5, "0.5"],
    [1, "1"],
  ])("crossfade at p = %s sets opacity %s", (p, opacity) => {
    expect(imageFxFrame("crossfade", "left", linear, p)).toEqual(frame({ opacity }));
  });

  it.each([
    [0, frame({ opacity: "0", filter: "blur(18px)", transform: "scale(1.06)" })],
    [0.5, frame({ opacity: "0.5", filter: "blur(9px)", transform: "scale(1.03)" })],
    [1, frame({ opacity: "1", filter: "blur(0px)", transform: "scale(1)" })],
  ])("blur-up at p = %s", (p, expected) => {
    expect(imageFxFrame("blur", "left", linear, p)).toEqual(expected);
  });

  it.each([
    [0, frame({ opacity: "0", transform: "scale(1.35)" })],
    [0.5, frame({ opacity: "0.5", transform: "scale(1.175)" })],
    [1, frame({ opacity: "1", transform: "scale(1)" })],
  ])("zoom in at p = %s", (p, expected) => {
    expect(imageFxFrame("zoom", "left", linear, p)).toEqual(expected);
  });

  it("uses the reveal easing", () => {
    const quad: EasingFunction = (t) => t * t;
    expect(imageFxFrame("crossfade", "left", quad, 0.5).opacity).toBe("0.25");
  });
});

describe("imageFxFrame wipe", () => {
  it.each<[Origin, string, string, string]>([
    ["left", "inset(0 100% 0 0)", "inset(0 50% 0 0)", "inset(0 0% 0 0)"],
    ["right", "inset(0 0 0 100%)", "inset(0 0 0 50%)", "inset(0 0 0 0%)"],
    ["top", "inset(0 0 100% 0)", "inset(0 0 50% 0)", "inset(0 0 0% 0)"],
    ["bottom", "inset(100% 0 0 0)", "inset(50% 0 0 0)", "inset(0% 0 0 0)"],
    ["center", "circle(0% at 50% 50%)", "circle(37.5% at 50% 50%)", "circle(75% at 50% 50%)"],
    [
      "diagonal",
      "polygon(0 0, 0% 0, 0 0%)",
      "polygon(0 0, 100% 0, 0 100%)",
      "polygon(0 0, 200% 0, 0 200%)",
    ],
  ])("clips by %s at p = 0, 0.5 and 1", (origin, start, middle, end) => {
    expect(imageFxFrame("wipe", origin, linear, 0)).toEqual(frame({ clipPath: start }));
    expect(imageFxFrame("wipe", origin, linear, 0.5)).toEqual(frame({ clipPath: middle }));
    expect(imageFxFrame("wipe", origin, linear, 1)).toEqual(frame({ clipPath: end }));
  });

  it("falls back to a fade for the random origin", () => {
    expect(imageFxFrame("wipe", "random", linear, 0.5)).toEqual(frame({ opacity: "0.5" }));
  });
});

describe("imageFxFrame with overshoot easing", () => {
  it("never fades above 1 or blurs below 0", () => {
    expect(imageFxFrame("crossfade", "left", overshoot, 1).opacity).toBe("1");
    expect(imageFxFrame("blur", "left", overshoot, 1)).toEqual(
      frame({ opacity: "1", filter: "blur(0px)", transform: "scale(1)" }),
    );
  });

  it("never wipes past the edge", () => {
    expect(imageFxFrame("wipe", "left", overshoot, 1).clipPath).toBe("inset(0 0% 0 0)");
    expect(imageFxFrame("wipe", "center", overshoot, 1).clipPath).toBe("circle(75% at 50% 50%)");
  });

  it("lets zoom dip below scale 1, as the spec notes", () => {
    // 1 + (1 - 1.2) x 0.35 = 0.93.
    expect(imageFxFrame("zoom", "left", overshoot, 1)).toEqual(
      frame({ opacity: "1", transform: "scale(0.93)" }),
    );
  });
});

describe("imageFxFrame CSS", () => {
  const PROPERTIES = [
    ["opacity", "opacity"],
    ["filter", "filter"],
    ["transform", "transform"],
    ["clipPath", "clip-path"],
  ] as const;

  it("writes values Chromium accepts, for every effect, origin and step", () => {
    for (const style of STYLES) {
      for (const origin of ORIGINS) {
        for (const p of [0, 0.25, 0.5, 1]) {
          const result = imageFxFrame(style, origin, linear, p);
          for (const [key, property] of PROPERTIES) {
            if (result[key])
              expect(CSS.supports(property, result[key]), `${property}: ${result[key]}`).toBe(true);
          }
        }
      }
    }
  });

  it("shows the plain photo at p = 1 for every effect", () => {
    for (const style of STYLES) {
      for (const origin of ORIGINS) {
        const { opacity, filter, transform } = imageFxFrame(style, origin, linear, 1);
        expect(["", "1"]).toContain(opacity);
        expect(["", "blur(0px)"]).toContain(filter);
        expect(["", "scale(1)"]).toContain(transform);
      }
    }
  });
});

describe("applyImageFxFrame", () => {
  /** Adds a 100 x 50 px photo stand-in at the top-left corner of the page. */
  function photo() {
    const element = document.createElement("div");
    Object.assign(element.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: "100px",
      height: "50px",
    });
    document.body.append(element);
    return element;
  }

  it("writes all four inline styles", () => {
    const element = photo();
    applyImageFxFrame(element, imageFxFrame("blur", "left", linear, 0.5));
    expect(element.style.opacity).toBe("0.5");
    expect(element.style.filter).toBe("blur(9px)");
    expect(element.style.transform).toBe("scale(1.03)");
    applyImageFxFrame(element, imageFxFrame("wipe", "left", linear, 0.5));
    expect(element.style.clipPath).toBe("inset(0px 50% 0px 0px)");
  });

  it("removes properties the frame leaves empty", () => {
    const element = photo();
    applyImageFxFrame(element, imageFxFrame("blur", "left", linear, 0.5));
    applyImageFxFrame(element, imageFxFrame("crossfade", "left", linear, 0.5));
    expect(element.style.filter).toBe("");
    expect(element.style.transform).toBe("");
    expect(element.style.clipPath).toBe("");
  });

  // Clip-path also limits where an element can be hit, so elementFromPoint shows what is visible.
  it.each<[Origin, [number, number][], [number, number][]]>([
    [
      "left",
      [
        [10, 25],
        [45, 25],
      ],
      [
        [55, 25],
        [90, 25],
      ],
    ],
    [
      "right",
      [
        [55, 25],
        [90, 25],
      ],
      [
        [10, 25],
        [45, 25],
      ],
    ],
    [
      "top",
      [
        [50, 5],
        [50, 20],
      ],
      [
        [50, 30],
        [50, 45],
      ],
    ],
    [
      "bottom",
      [
        [50, 30],
        [50, 45],
      ],
      [
        [50, 5],
        [50, 20],
      ],
    ],
    [
      "center",
      [
        [50, 25],
        [60, 30],
      ],
      [
        [2, 2],
        [98, 48],
      ],
    ],
    [
      "diagonal",
      [
        [2, 2],
        [40, 5],
      ],
      [
        [98, 48],
        [80, 40],
      ],
    ],
  ])("shows the right part of the photo half-way through a %s wipe", (origin, shown, hidden) => {
    const element = photo();
    applyImageFxFrame(element, imageFxFrame("wipe", origin, linear, 0.5));
    for (const [x, y] of shown)
      expect(document.elementFromPoint(x, y), `(${x}, ${y}) shown`).toBe(element);
    for (const [x, y] of hidden)
      expect(document.elementFromPoint(x, y), `(${x}, ${y}) hidden`).not.toBe(element);
  });

  it.each(ORIGINS)("shows the whole photo at the end of a %s wipe", (origin) => {
    const element = photo();
    applyImageFxFrame(element, imageFxFrame("wipe", origin, linear, 1));
    for (const [x, y] of [
      [1, 1],
      [99, 1],
      [1, 49],
      [99, 49],
      [50, 25],
    ] as const) {
      expect(document.elementFromPoint(x, y), `(${x}, ${y})`).toBe(element);
    }
  });
});
