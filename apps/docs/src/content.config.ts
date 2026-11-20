// content.config.ts: tells Astro where the docs pages are and how Starlight checks their front matter.

import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

/** The collections Astro reads: the docs pages, with Starlight's front matter schema. */
export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
