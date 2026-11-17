import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

// In the workspace, @veilo/svelte links to packages/svelte, which has its own copy of Svelte for
// its tests. Dedupe makes it use this app's Svelte, as an installed package would.
export default defineConfig({
  plugins: [svelte()],
  resolve: { dedupe: ["svelte"] },
});
