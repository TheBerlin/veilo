// demo-scenes.ts: the demo cards' pictures: the street is drawn in code, the album is a
// photograph (credits in assets/CREDITS.md) with drawn art as the fallback. The reveal samples
// whatever the canvas holds.

import albumCoverUrl from "./assets/album-cover.webp";
import videoThumbUrl from "./assets/video-thumb.webp";

/** The pictures the demos use. */
export type SceneId = "street" | "album" | "video";

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

/** The photograph each photographic scene shows. */
const PHOTO_URLS: Partial<Record<SceneId, string>> = { album: albumCoverUrl, video: videoThumbUrl };
/** The decoded photographs, once loaded; until then the drawn art stands in. */
const photos = new Map<SceneId, HTMLImageElement>();
/** The one load of each photograph, shared by every caller. */
const photoLoads = new Map<SceneId, Promise<void>>();

/**
 * Loads and decodes a scene's photograph once. A failed load is not an error: the drawn art
 * keeps standing in.
 *
 * Side effects: starts one image request the first time; later calls share it.
 *
 * @param scene - The photographic scene.
 * @returns A promise that resolves when the photograph is ready or has failed to load.
 */
export function preloadPhoto(scene: SceneId): Promise<void> {
  let load = photoLoads.get(scene);
  if (!load) {
    load = new Promise<void>((resolve) => {
      const url = PHOTO_URLS[scene];
      if (!url) return resolve();
      const image = new Image();
      image.onload = () => {
        photos.set(scene, image);
        resolve();
      };
      image.onerror = () => resolve();
      image.src = url;
    });
    photoLoads.set(scene, load);
  }
  return load;
}

/**
 * Tells whether a scene's photograph is loaded.
 *
 * @param scene - The photographic scene.
 * @returns True once {@link preloadPhoto} has loaded it.
 */
export function photoLoaded(scene: SceneId): boolean {
  return photos.has(scene);
}

/**
 * Loads and decodes the album cover photograph once.
 *
 * @returns A promise that resolves when the cover is ready or has failed to load.
 */
export function preloadAlbumCover(): Promise<void> {
  return preloadPhoto("album");
}

/**
 * Tells whether the album cover photograph is loaded.
 *
 * @returns True once {@link preloadAlbumCover} has loaded the photograph.
 */
export function albumCoverLoaded(): boolean {
  return photoLoaded("album");
}

/**
 * Draws a photograph over the whole canvas, scaled to cover it and centered.
 *
 * @param context - The canvas context.
 * @param image - The decoded photograph.
 * @param w - Width in px.
 * @param h - Height in px.
 */
function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  w: number,
  h: number,
): void {
  // The larger of the two scales makes the image cover the canvas; the overflow is cropped evenly.
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  context.drawImage(image, (w - drawW) / 2, (h - drawH) / 2, drawW, drawH);
}

/**
 * Draws a scene on a canvas. The reveal samples these pixels, so call it before the reveal is
 * created. The album uses the photograph when it is loaded, and the drawn art otherwise.
 *
 * @param canvas - The picture canvas.
 * @param scene - Which picture to draw.
 * @param ratio - The canvas's width divided by its height.
 */
export function drawScene(canvas: HTMLCanvasElement, scene: SceneId, ratio: number): void {
  const { width, height } = sizeCanvas(canvas, ratio);
  const context = canvas.getContext("2d");
  if (!context) return;
  const photo = photos.get(scene);
  if (photo) drawCover(context, photo, width, height);
  else if (scene === "album") drawAlbum(context, width, height);
  else drawStreet(context, width, height);
}

// Start fetching at import, so the cover is usually ready before the music card is chosen.
if (typeof Image !== "undefined") {
  void preloadPhoto("album");
  void preloadPhoto("video");
}
