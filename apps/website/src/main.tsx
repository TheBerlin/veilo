// main.tsx: entry of the website app. Loads the fonts and design tokens and mounts the app.

// Self-hosted fonts (no third-party request): the weights the tokens use. IBM Plex Mono is also
// the glyph ramps' font.
import "@fontsource/geist/400.css";
import "@fontsource/geist/500.css";
import "@fontsource/geist/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@veilo-ui/ui/tokens.css";
import "./global.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
