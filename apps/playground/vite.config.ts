import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The playground app. `pnpm --filter playground dev` serves it; `build` writes dist/.
export default defineConfig({
  plugins: [react()],
});
