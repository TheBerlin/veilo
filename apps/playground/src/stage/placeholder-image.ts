// placeholder-image.ts: the test card's default photo, drawn in code. A dark rounded shape on a
// light gradient, so the dot and character grids have strong contrast to sample.

import { sizeSquareCanvas } from "./image-source.ts";

/**
 * Sizes a square canvas to its CSS width times the pixel ratio and draws the placeholder.
 * Side effects: sets the canvas's width and height, which clears it, then draws.
 *
 * @param canvas - The image-area canvas, already laid out.
 * @param pixelRatio - The device pixel ratio, capped at 2.
 */
export function drawPlaceholderImage(canvas: HTMLCanvasElement, pixelRatio: number): void {
  const size = sizeSquareCanvas(canvas, pixelRatio);
  const context = canvas.getContext("2d");
  if (!context) return;

  // Light background, slightly darker toward the bottom.
  const background = context.createLinearGradient(0, 0, 0, size);
  background.addColorStop(0, "#f4f6f6");
  background.addColorStop(1, "#d9dfe0");
  context.fillStyle = background;
  context.fillRect(0, 0, size, size);

  // Soft floor shadow under the shape.
  context.fillStyle = "rgba(0, 0, 0, 0.18)";
  context.beginPath();
  context.ellipse(size * 0.5, size * 0.8, size * 0.24, size * 0.05, 0, 0, Math.PI * 2);
  context.fill();

  // The dark body: an upright rounded shape, a little like a mouse seen from above.
  context.fillStyle = "#1d2326";
  context.beginPath();
  context.roundRect(size * 0.32, size * 0.18, size * 0.36, size * 0.6, size * 0.18);
  context.fill();

  // A light seam down the middle, for some detail in the grids.
  context.strokeStyle = "#5b6a70";
  context.lineWidth = Math.max(1, size * 0.01);
  context.beginPath();
  context.moveTo(size * 0.5, size * 0.2);
  context.lineTo(size * 0.5, size * 0.38);
  context.stroke();
}
