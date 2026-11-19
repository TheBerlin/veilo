import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// In the workspace, @veilo-ui/vue links to packages/vue, which has its own copy of Vue for its
// tests. Dedupe makes it use this app's Vue, as an installed package would.
export default defineConfig({
  plugins: [vue()],
  resolve: { dedupe: ["vue"] },
});
