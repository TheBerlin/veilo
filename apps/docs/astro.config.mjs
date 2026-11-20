// astro.config.mjs: the docs site. Starlight supplies the layout, navigation, search (Pagefind)
// and the dark/light switch; src/styles/theme.css maps its colors and fonts onto the Veilo tokens.

import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [
    starlight({
      title: "Veilo UI",
      description:
        "Skeleton loaders and reveal animations for images and text: guides, the settings reference and every ready-made effect.",
      favicon: "/favicon.svg",
      social: [{ icon: "github", label: "GitHub", href: "https://github.com/TheBerlin/veilo" }],
      // The tokens first, so the theme file can read them.
      customCss: [
        "@fontsource/geist/400.css",
        "@fontsource/geist/500.css",
        "@fontsource/geist/700.css",
        "@fontsource/ibm-plex-mono/400.css",
        "@veilo-ui/ui/tokens.css",
        "./src/styles/theme.css",
      ],
    }),
  ],
});
