// fit.ts: the part of an image to draw so it covers a box, like CSS `object-fit: cover`.
// Layer 0 (pure). Must not import DOM code.

/** A rectangle in source pixels. */
export interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Finds the centered part of a source image that fills a box without stretching.
 *
 * Drawing this crop into the whole box gives the same picture as `object-fit: cover`: the image
 * is scaled to cover the box, and what spills over on one side is cut equally from both ends.
 *
 * @param sourceWidth - Source width, above 0.
 * @param sourceHeight - Source height, above 0.
 * @param boxWidth - Box width, above 0.
 * @param boxHeight - Box height, above 0.
 * @returns The crop, in source pixels.
 */
export function coverCrop(
  sourceWidth: number,
  sourceHeight: number,
  boxWidth: number,
  boxHeight: number,
): Crop {
  // The box's shape, drawn as large as fits inside the source.
  const scale = Math.min(sourceWidth / boxWidth, sourceHeight / boxHeight);
  const width = boxWidth * scale;
  const height = boxHeight * scale;
  return { x: (sourceWidth - width) / 2, y: (sourceHeight - height) / 2, width, height };
}
