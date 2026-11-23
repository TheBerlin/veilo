// variants-main.tsx: entry of the variants reference page (/variants.html). Loads the same fonts
// and design tokens as the site and mounts the page.

import "@fontsource/geist/400.css";
import "@fontsource/geist/500.css";
import "@fontsource/geist/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@veilo-ui/ui/tokens.css";
import "../global.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { VariantsPage } from "./variants-page.tsx";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <VariantsPage />
    </StrictMode>,
  );
}
