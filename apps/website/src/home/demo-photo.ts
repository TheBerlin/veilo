// demo-photo.ts: draws the demo card's photo, the picture the reveal samples.

/**
 * Sizes a square canvas to its CSS width times the pixel ratio (at most 2).
 *
 * @param canvas - The photo canvas, already laid out.
 * @returns The side in device pixels.
 */
function sizeSquare(canvas: HTMLCanvasElement): number {
  const size = Math.max(2, Math.round(canvas.clientWidth * Math.min(2, devicePixelRatio)));
  canvas.width = size;
  canvas.height = size;
  return size;
}

/**
 * Draws a dark rounded product shape on a light gradient, the playground's default photo.
 * The reveal reads these pixels, so call it before the reveal is created.
 *
 * @param canvas - The photo canvas.
 */
export function drawProductPhoto(canvas: HTMLCanvasElement): void {
  const size = sizeSquare(canvas);
  const context = canvas.getContext("2d");
  if (!context) return;
  const ground = context.createLinearGradient(0, 0, 0, size);
  ground.addColorStop(0, "#f4f6f6");
  ground.addColorStop(1, "#d9dfe0");
  context.fillStyle = ground;
  context.fillRect(0, 0, size, size);
  // Soft contact shadow under the product.
  context.fillStyle = "rgba(0, 0, 0, 0.18)";
  context.beginPath();
  context.ellipse(size * 0.5, size * 0.8, size * 0.24, size * 0.05, 0, 0, Math.PI * 2);
  context.fill();
  // The product body, with a seam line near the top.
  context.fillStyle = "#1d2326";
  context.beginPath();
  context.roundRect(size * 0.32, size * 0.18, size * 0.36, size * 0.6, size * 0.18);
  context.fill();
  context.strokeStyle = "#5b6a70";
  context.lineWidth = Math.max(1, size * 0.01);
  context.beginPath();
  context.moveTo(size * 0.5, size * 0.2);
  context.lineTo(size * 0.5, size * 0.38);
  context.stroke();
}
