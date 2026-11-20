import { describe, expect, it } from "vitest";
import { parseFrameQuery, parsePresetQuery } from "../../../src/playground/stage/frame-query.ts";

describe("parseFrameQuery", () => {
  it("reads a preset id and a progress", () => {
    const request = parseFrameQuery("?preset=hex-from-center&p=0.25");
    expect(request?.preset.id).toBe("hex-from-center");
    expect(request?.p).toBe(0.25);
  });

  it("accepts a query without the leading question mark", () => {
    expect(parseFrameQuery("preset=dot-upscale&p=1")?.p).toBe(1);
  });

  it("clamps the progress to 0..1", () => {
    expect(parseFrameQuery("?preset=dot-upscale&p=-2")?.p).toBe(0);
    expect(parseFrameQuery("?preset=dot-upscale&p=7")?.p).toBe(1);
  });

  it("asks for no frame when a part is missing or invalid", () => {
    expect(parseFrameQuery("")).toBeNull();
    expect(parseFrameQuery("?preset=dot-upscale")).toBeNull();
    expect(parseFrameQuery("?p=0.5")).toBeNull();
    expect(parseFrameQuery("?preset=dot-upscale&p=")).toBeNull();
    expect(parseFrameQuery("?preset=dot-upscale&p=half")).toBeNull();
    expect(parseFrameQuery("?preset=dot-upscale&p=Infinity")).toBeNull();
    expect(parseFrameQuery("?preset=no-such-preset&p=0.5")).toBeNull();
  });
});

describe("parsePresetQuery", () => {
  it("reads a link to a preset: a preset id and nothing else", () => {
    expect(parsePresetQuery("?preset=hex-from-center")?.id).toBe("hex-from-center");
    expect(parsePresetQuery("preset=cascade-wave")?.id).toBe("cascade-wave");
  });

  it("is not a preset link when the query holds a progress, which makes it a frame request", () => {
    expect(parsePresetQuery("?preset=hex-from-center&p=0.5")).toBeNull();
    // Even a broken progress: the visual tests' links are never read as a plain preset link.
    expect(parsePresetQuery("?preset=hex-from-center&p=")).toBeNull();
    expect(parsePresetQuery("?preset=hex-from-center&p=half")).toBeNull();
  });

  it("asks for nothing when the preset is missing or unknown", () => {
    expect(parsePresetQuery("")).toBeNull();
    expect(parsePresetQuery("?p=0.5")).toBeNull();
    expect(parsePresetQuery("?preset=")).toBeNull();
    expect(parsePresetQuery("?preset=no-such-preset")).toBeNull();
  });

  it("reads every preset the playground has", () => {
    for (const id of [
      "dot-upscale",
      "hex-from-center",
      "matrix-columns",
      "cascade-wave",
      "soft-pulse",
      "compact-shimmer",
      "mosaic-from-edge",
    ]) {
      expect(parsePresetQuery(`?preset=${id}`)?.id).toBe(id);
    }
  });
});
