import { describe, expect, it } from "vitest";
import { parseFrameQuery } from "../../../src/playground/stage/frame-query.ts";

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
