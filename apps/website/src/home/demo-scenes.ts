// demo-scenes.ts: the demo cards' pictures, drawn in code. Stand-ins until real photographs
// replace them; the reveal samples whatever the canvas holds.

/** The pictures the demos use. */
export type SceneId = "street" | "album";

/**
 * Sizes a canvas to its CSS width times the pixel ratio (at most 2), and its height from the
 * given width-to-height ratio.
 *
 * @param canvas - The picture canvas, already laid out.
 * @param ratio - Width divided by height.
 * @returns The canvas size in device pixels.
 */
function sizeCanvas(canvas: HTMLCanvasElement, ratio: number): { width: number; height: number } {
  const width = Math.max(2, Math.round(canvas.clientWidth * Math.min(2, devicePixelRatio)));
  const height = Math.max(2, Math.round(width / ratio));
  canvas.width = width;
  canvas.height = height;
  return { width, height };
}

/**
 * Fills the canvas with a vertical gradient between evenly spaced color stops.
 *
 * @param context - The canvas context.
 * @param width - The canvas width in px.
 * @param height - The canvas height in px.
 * @param stops - Colors from top to bottom.
 */
function fillGradient(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  stops: readonly string[],
): void {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  stops.forEach((color, index) => gradient.addColorStop(index / (stops.length - 1), color));
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

/**
 * A night street: a gradient sky and rows of lit windows.
 *
 * @param context - The canvas context.
 * @param w - Width in px.
 * @param h - Height in px.
 */
function drawStreet(context: CanvasRenderingContext2D, w: number, h: number): void {
  fillGradient(context, w, h, ["#10122b", "#3a2a6b", "#d2678a"]);
  const buildings = [0.0, 0.16, 0.3, 0.47, 0.62, 0.8];
  buildings.forEach((left, index) => {
    const width = (index === buildings.length - 1 ? 1 - left : buildings[index + 1]! - left) * w;
    const top = h * (0.3 + ((index * 37) % 5) * 0.07);
    context.fillStyle = index % 2 ? "#161833" : "#1f1f45";
    context.fillRect(left * w, top, width, h - top);
    context.fillStyle = "#ffd98a";
    for (let y = top + h * 0.05; y < h - h * 0.06; y += h * 0.09) {
      for (
        let x = left * w + width * 0.12;
        x < left * w + width - width * 0.18;
        x += width * 0.24
      ) {
        if ((Math.floor(x + y) * 7) % 3) context.fillRect(x, y, width * 0.09, h * 0.04);
      }
    }
  });
}

/**
 * Album art: concentric rings and a bright disc on a deep gradient.
 *
 * @param context - The canvas context.
 * @param w - Width in px.
 * @param h - Height in px.
 */
function drawAlbum(context: CanvasRenderingContext2D, w: number, h: number): void {
  fillGradient(context, w, h, ["#12335b", "#5b2a86", "#e0457b"]);
  const cx = w * 0.5;
  const cy = h * 0.5;
  for (let ring = 5; ring >= 1; ring--) {
    context.strokeStyle = `rgba(255, 255, 255, ${0.08 + ring * 0.03})`;
    context.lineWidth = w * 0.012;
    context.beginPath();
    context.arc(cx, cy, w * 0.09 * ring, 0, Math.PI * 2);
    context.stroke();
  }
  const disc = context.createRadialGradient(cx, cy, 0, cx, cy, w * 0.16);
  disc.addColorStop(0, "#fff3c4");
  disc.addColorStop(1, "#ffb347");
  context.fillStyle = disc;
  context.beginPath();
  context.arc(cx, cy, w * 0.16, 0, Math.PI * 2);
  context.fill();
}

/**
 * Draws a scene on a canvas. The reveal samples these pixels, so call it before the reveal is
 * created.
 *
 * @param canvas - The picture canvas.
 * @param scene - Which picture to draw.
 * @param ratio - The canvas's width divided by its height.
 */
export function drawScene(canvas: HTMLCanvasElement, scene: SceneId, ratio: number): void {
  const { width, height } = sizeCanvas(canvas, ratio);
  const context = canvas.getContext("2d");
  if (!context) return;
  if (scene === "street") drawStreet(context, width, height);
  else drawAlbum(context, width, height);
}
