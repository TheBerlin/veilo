import { defineConfig } from "tsdown";
import { sharedOptions } from "../../tsdown.shared.ts";

// Three entries: the plain-JavaScript API, the React component and the web component. React is a
// peer dependency, so it stays external. tsconfig.build.json covers src only, so test helpers
// never reach the build.
export default defineConfig({
  ...sharedOptions,
  entry: { index: "src/index.ts", react: "src/react.tsx", element: "src/element.ts" },
  tsconfig: "tsconfig.build.json",
  // The React entry uses hooks, so it is a client module: the "use client" line lets React Server
  // Components frameworks import it from server files. The other entries stay plain.
  outputOptions: {
    banner: (chunk) => (chunk.name === "react" && chunk.isEntry ? '"use client";' : ""),
  },
});
