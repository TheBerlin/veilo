<!--
  App.svelte: a product card whose data loads like a real fetch. While it loads, Veilo shows the
  skeleton on the card's own markup; when the data arrives, the reveal plays.
-->
<script lang="ts">
  import { Reveal, skeleton } from "@veilo/svelte";
  import { onMount } from "svelte";
  import { fetchProduct, PLACEHOLDER, type Product } from "./product";

  let product = $state<Product | null>(null);
  let status = $state("Loading");
  // The card renders the same markup for placeholder and real data, so the skeleton has the real
  // sizes. `data-veilo-slot` marks the parts Veilo animates.
  const shown = $derived(product ?? PLACEHOLDER);
  // Only the latest load may win when Reload is pressed quickly.
  let request = 0;

  /** Loads the product again: back to the skeleton, then the reveal when the data arrives. */
  function load() {
    const id = ++request;
    product = null;
    status = "Loading";
    void fetchProduct().then((data) => {
      if (id === request) product = data;
    });
  }

  onMount(load);
</script>

<main>
  <h1>Veilo Svelte demo</h1>
  <Reveal
    as="article"
    class="card"
    ready={product !== null}
    preset="dot-upscale"
    oncomplete={() => (status = "Revealed")}
  >
    <img class="photo" data-veilo-slot="photo" src={shown.image} alt={shown.name} />
    <h2 data-veilo-slot="title">{shown.name}</h2>
    <p data-veilo-slot="description">{shown.description}</p>
    <p class="price" data-veilo-slot="price">{shown.price}</p>
    <button type="button" data-veilo-slot="buy">
      <span data-veilo-slot="label">Add to cart</span>
    </button>
  </Reveal>
  <p class="seller">
    <span
      class="avatar"
      aria-hidden="true"
      use:skeleton={{ loading: product === null, self: true, effect: "pulse" }}
    ></span>
    Sold by Veilo Store
  </p>
  <p role="status" data-testid="status">{status}</p>
  <button type="button" onclick={load}>Reload</button>
</main>
