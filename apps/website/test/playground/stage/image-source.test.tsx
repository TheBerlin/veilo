// Tests for src/stage/image-source.ts, in Chromium (canvas and image decoding).

import { describe, expect, it } from "vitest";
import {
  coverRect,
  drawImageCover,
  loadImageFile,
  loadImageUrl,
  NOT_AN_IMAGE,
  SAMPLE_IMAGES,
} from "../../../src/playground/stage/image-source.ts";

/**
 * Makes a PNG blob of a solid color.
 *
 * @param width - Width in pixels.
 * @param height - Height in pixels.
 * @param color - Fill color.
 * @returns The PNG blob.
 */
async function pngBlob(width: number, height: number, color: string): Promise<Blob> {
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d")!;
  context.fillStyle = color;
  context.fillRect(0, 0, width, height);
  return canvas.convertToBlob({ type: "image/png" });
}

describe("coverRect", () => {
  it("takes the centered square of a tall, wide or square image", () => {
    expect(coverRect(100, 300, 1)).toEqual({ x: 0, y: 100, width: 100, height: 100 });
    expect(coverRect(300, 100, 1)).toEqual({ x: 100, y: 0, width: 100, height: 100 });
    expect(coverRect(50, 50, 1)).toEqual({ x: 0, y: 0, width: 50, height: 50 });
  });

  it("takes the largest centered part of any ratio", () => {
    // A square image into 16:9 crops top and bottom; into 3:4 crops the sides.
    expect(coverRect(160, 160, 16 / 9)).toEqual({ x: 0, y: 35, width: 160, height: 90 });
    expect(coverRect(160, 160, 3 / 4)).toEqual({ x: 20, y: 0, width: 120, height: 160 });
    // Already the right shape: the whole image.
    expect(coverRect(320, 180, 16 / 9)).toEqual({ x: 0, y: 0, width: 320, height: 180 });
  });
});

describe("drawImageCover", () => {
  it("sizes the canvas to the ratio from its CSS width", async () => {
    const bitmap = await createImageBitmap(new ImageData(4, 4));
    const canvas = document.createElement("canvas");
    canvas.style.width = "320px";
    document.body.append(canvas);
    drawImageCover(canvas, bitmap, 16 / 9, 1);
    expect([canvas.width, canvas.height]).toEqual([320, 180]);
    drawImageCover(canvas, bitmap, 2 / 3, 2);
    expect([canvas.width, canvas.height]).toEqual([640, 960]);
    canvas.remove();
  });

  it("fills the square canvas with the image's middle, on white", async () => {
    // A tall image: red middle, transparent top and bottom bands that cover-fit crops away.
    const source = new OffscreenCanvas(10, 30);
    const context = source.getContext("2d")!;
    context.fillStyle = "rgb(255, 0, 0)";
    context.fillRect(0, 10, 10, 10);
    const bitmap = await createImageBitmap(source);

    const canvas = document.createElement("canvas");
    canvas.style.width = "200px";
    document.body.append(canvas);
    drawImageCover(canvas, bitmap, 1, 1);
    expect([canvas.width, canvas.height]).toEqual([200, 200]);
    const pixel = canvas.getContext("2d")!.getImageData(100, 100, 1, 1).data;
    expect([...pixel]).toEqual([255, 0, 0, 255]);
    canvas.remove();
  });

  it("blends transparency onto white", async () => {
    // Fully transparent pixels; a canvas that was never drawn on cannot become a bitmap.
    const source = new OffscreenCanvas(4, 4);
    source.getContext("2d")!.clearRect(0, 0, 4, 4);
    const bitmap = await createImageBitmap(source);
    const canvas = document.createElement("canvas");
    canvas.style.width = "160px";
    document.body.append(canvas);
    drawImageCover(canvas, bitmap, 1, 1);
    expect([...canvas.getContext("2d")!.getImageData(5, 5, 1, 1).data]).toEqual([
      255, 255, 255, 255,
    ]);
    canvas.remove();
  });
});

describe("loadImageFile", () => {
  it("decodes an image file", async () => {
    const image = await loadImageFile(await pngBlob(6, 4, "blue"));
    expect([image.width, image.height]).toEqual([6, 4]);
  });

  it("rejects a non-image and an image type that does not decode", async () => {
    await expect(loadImageFile(new Blob(["hi"], { type: "text/plain" }))).rejects.toThrow(
      NOT_AN_IMAGE,
    );
    await expect(loadImageFile(new Blob(["hi"], { type: "image/png" }))).rejects.toThrow(
      NOT_AN_IMAGE,
    );
  });
});

describe("SAMPLE_IMAGES", () => {
  it("are square 640 px images that load", async () => {
    expect(SAMPLE_IMAGES.length).toBeGreaterThan(0);
    for (const sample of SAMPLE_IMAGES) {
      const image = await loadImageUrl(sample.url);
      expect([image.naturalWidth, image.naturalHeight]).toEqual([640, 640]);
    }
  });
});
