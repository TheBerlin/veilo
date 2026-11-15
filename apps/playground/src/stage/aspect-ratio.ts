// aspect-ratio.ts: the shapes the test card's image area can take. Core samples any shape (rows
// follow the ratio), so only the preview needs to know them.

/** The ratio choices, in the order the select shows them. */
export const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1, square", value: 1 },
  { id: "4:3", label: "4:3", value: 4 / 3 },
  { id: "3:2", label: "3:2", value: 3 / 2 },
  { id: "16:9", label: "16:9, wide", value: 16 / 9 },
  { id: "3:4", label: "3:4, tall", value: 3 / 4 },
  { id: "2:3", label: "2:3, tall", value: 2 / 3 },
  { id: "image", label: "Image's own" },
] as const;

/** One ratio choice's id. */
export type AspectRatioId = (typeof ASPECT_RATIOS)[number]["id"];

/** The ratio the card starts with: square, as in the spec and the visual baselines. */
export const DEFAULT_RATIO: AspectRatioId = "1:1";

/**
 * The narrowest and widest an image's own ratio may make the image area, so a panorama or a
 * long screenshot cannot shrink it to a thin strip.
 */
export const OWN_RATIO_LIMITS = { min: 1 / 3, max: 3 } as const;

/**
 * Narrows any value to a ratio id, for saved or shared input.
 *
 * @param value - An unchecked value.
 * @returns The id, or `undefined` when the value is not one.
 */
export function toRatioId(value: unknown): AspectRatioId | undefined {
  return ASPECT_RATIOS.find((ratio) => ratio.id === value)?.id;
}

/**
 * The width-to-height ratio of the image area.
 *
 * @param id - The chosen ratio.
 * @param image - The card's image, for "Image's own"; `null` for the drawn placeholder, which
 *   is square.
 * @returns Width divided by height.
 */
export function ratioValue(
  id: AspectRatioId,
  image: { width: number; height: number } | null,
): number {
  const fixed = ASPECT_RATIOS.find((ratio) => ratio.id === id);
  if (fixed && "value" in fixed) return fixed.value;
  if (!image || image.width <= 0 || image.height <= 0) return 1;
  const own = image.width / image.height;
  return Math.min(OWN_RATIO_LIMITS.max, Math.max(OWN_RATIO_LIMITS.min, own));
}
