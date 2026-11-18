import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The website app. `pnpm --filter website dev` serves it; `build` writes dist/.
export default defineConfig({
  plugins: [react()],
});
