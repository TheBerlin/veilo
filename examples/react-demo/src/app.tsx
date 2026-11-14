// app.tsx: a product card whose data loads like a real fetch. While it loads, Veilo shows the
// skeleton on the card's own markup; when the data arrives, the reveal plays.

import { Reveal, Skeleton } from "@veilo/react";
import { useCallback, useEffect, useState } from "react";
import { fetchProduct, PLACEHOLDER, type Product } from "./product";

/**
 * The card. It renders the same markup for placeholder and real data, so the skeleton has the
 * real sizes. `data-veilo-slot` marks the parts Veilo animates.
 *
 * @param props - The product to show.
 * @returns The card's contents.
 */
function ProductCard(props: { product: Product }) {
  const { product } = props;
  return (
    <>
      <img className="photo" data-veilo-slot="photo" src={product.image} alt={product.name} />
      <h2 data-veilo-slot="title">{product.name}</h2>
      <p data-veilo-slot="description">{product.description}</p>
      <p className="price" data-veilo-slot="price">
        {product.price}
      </p>
      <button type="button" data-veilo-slot="buy">
        <span data-veilo-slot="label">Add to cart</span>
      </button>
    </>
  );
}

/**
 * The demo page: the card, a seller avatar, a status line and a Reload button.
 *
 * @returns The page.
 */
export function App() {
  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState("Loading");

  const load = useCallback(() => {
    setProduct(null);
    setStatus("Loading");
    let cancelled = false;
    void fetchProduct().then((data) => {
      if (!cancelled) setProduct(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(load, [load]);

  return (
    <main>
      <h1>Veilo React demo</h1>
      <Reveal
        as="article"
        className="card"
        ready={product !== null}
        preset="dot-upscale"
        onComplete={() => setStatus("Revealed")}
      >
        <ProductCard product={product ?? PLACEHOLDER} />
      </Reveal>
      <p className="seller">
        <Skeleton loading={product === null} asChild effect="pulse">
          <span className="avatar" aria-hidden="true" />
        </Skeleton>
        Sold by Veilo Store
      </p>
      <p role="status" data-testid="status">
        {status}
      </p>
      <button type="button" onClick={load}>
        Reload
      </button>
    </main>
  );
}
