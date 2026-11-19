<!--
  App.vue: a product card whose data loads like a real fetch. While it loads, Veilo shows the
  skeleton on the card's own markup; when the data arrives, the reveal plays.
-->
<script setup lang="ts">
import { Reveal, Skeleton } from "@veilo-ui/vue";
import { computed, onMounted, ref } from "vue";
import { fetchProduct, PLACEHOLDER, type Product } from "./product";

const product = ref<Product | null>(null);
const status = ref("Loading");
// The card renders the same markup for placeholder and real data, so the skeleton has the real
// sizes. `data-veilo-slot` marks the parts Veilo animates.
const shown = computed(() => product.value ?? PLACEHOLDER);
// Only the latest load may win when Reload is pressed quickly.
let request = 0;

/** Loads the product again: back to the skeleton, then the reveal when the data arrives. */
function load() {
  const id = ++request;
  product.value = null;
  status.value = "Loading";
  void fetchProduct().then((data) => {
    if (id === request) product.value = data;
  });
}

onMounted(load);
</script>

<template>
  <main>
    <h1>Veilo Vue demo</h1>
    <Reveal
      as="article"
      class="card"
      :ready="product !== null"
      preset="dot-upscale"
      @complete="status = 'Revealed'"
    >
      <img class="photo" data-veilo-slot="photo" :src="shown.image" :alt="shown.name" />
      <h2 data-veilo-slot="title">{{ shown.name }}</h2>
      <p data-veilo-slot="description">{{ shown.description }}</p>
      <p class="price" data-veilo-slot="price">{{ shown.price }}</p>
      <button type="button" data-veilo-slot="buy">
        <span data-veilo-slot="label">Add to cart</span>
      </button>
    </Reveal>
    <p class="seller">
      <Skeleton :loading="product === null" as-child effect="pulse">
        <span class="avatar" aria-hidden="true" />
      </Skeleton>
      Sold by Veilo Store
    </p>
    <p role="status" data-testid="status">{{ status }}</p>
    <button type="button" @click="load">Reload</button>
  </main>
</template>
