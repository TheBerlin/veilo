import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// In the workspace, @veilo-ui/react links to packages/react, which has React 18 for its own tests.
// Dedupe makes it use this app's React 19, as an installed package would.
export default defineConfig({
  plugins: [react()],
  resolve: { dedupe: ["react", "react-dom"] },
});
