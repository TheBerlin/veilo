import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

// TypeScript in .svelte files is stripped by Vite's own preprocessor; svelte-package and
// svelte-check read this file too.
export default { preprocess: vitePreprocess() };
