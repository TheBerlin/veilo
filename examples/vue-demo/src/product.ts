// product.ts: the demo's data: a fake fetch, and placeholder data of the same shape.

/** A product as the card shows it. */
export interface Product {
  name: string;
  description: string;
  price: string;
  /** Image URL. */
  image: string;
}

/** A small drawn mouse, as an SVG data URL, so the demo needs no image files or network. */
const MOUSE_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
      '<rect width="200" height="200" fill="#eef1f1"/>' +
      '<ellipse cx="100" cy="172" rx="56" ry="10" fill="#c9cdcd"/>' +
      '<rect x="62" y="30" width="76" height="136" rx="38" fill="#1e2124"/>' +
      '<rect x="98" y="44" width="4" height="34" rx="2" fill="#6b7175"/>' +
      "</svg>",
  );

/**
 * Data in the real shape, with text of a typical length, so the placeholders have real sizes.
 * The image is an empty square of the same size until the real one arrives.
 */
export const PLACEHOLDER: Product = {
  name: "Product name here",
  description: "A short description of the product, about two lines long.",
  price: "$00.00",
  image:
    "data:image/svg+xml," +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"/>'),
};

/**
 * Loads the product after a delay, like a slow network.
 *
 * @param delayMs - How long the "request" takes.
 * @returns The product.
 */
export function fetchProduct(delayMs = 1500): Promise<Product> {
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          name: "MCHOSE L7 Pro",
          description: "Lightweight 8K polling mouse with tri-mode wireless and a 60 g shell.",
          price: "$59.99",
          image: MOUSE_IMAGE,
        }),
      delayMs,
    );
  });
}
