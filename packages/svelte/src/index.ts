// index.ts: the public entry `@veilo/svelte`. Svelte 5 bindings over @veilo/core. Imports here and
// in the components name `.js` files: svelte-package copies sources as they are, so a `.ts` path
// would point at a file that is not in dist.

export { reveal, skeleton, type RevealParams, type SkeletonParams } from "./actions.js";
export { default as Reveal, type RevealElement, type RevealProps } from "./Reveal.svelte";
export { default as Skeleton, type SkeletonProps } from "./Skeleton.svelte";
export type { LayoutInput, RevealConfig } from "@veilo/presets";
