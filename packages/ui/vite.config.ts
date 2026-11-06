import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The component preview page: `pnpm --filter @veilo/ui dev`. Not built or deployed.
export default defineConfig({
  root: "preview",
  plugins: [react()],
});
