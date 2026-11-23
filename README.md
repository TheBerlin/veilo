# Veilo

Veilo is a free, open-source playground and package family for **skeleton loaders** (the placeholder shown while content loads) and **reveal animations** (the transition from placeholder to real content, for images and text).

Tune an effect with live controls, scrub it frame by frame, and export it as CSS or JSON. The same settings object drives a framework-agnostic engine that runs in plain HTML or any framework.

> **Status:** early development, version 0.7.0. The core engine, the CSS loaders, the wrappers for React, Vue, Svelte and Angular, the web components with their CDN bundle and the playground are done (share links, saved presets, any image ratio, editable card content, a reduced-motion preview and code for every package), and every preset is locked by screenshot tests; the playground runs on a staging site at https://veilo-playground.vercel.app. Nothing is published to npm yet, and the API can still change before 1.0.

## What it does

- **Skeleton loaders:** shimmer, wave and pulse, from CSS alone or driven by JavaScript.
- **Image reveals:** dot, hex, binary and mosaic grids sampled from the real photo, plus crossfade, blur-up, zoom and wipe.
- **Text reveals:** scramble, typewriter, rise and fade, with a fading button background.
- **Plain JSON settings:** one versioned settings object, validated by a JSON Schema, shared by the playground, the exports and the packages.
- **Accessible defaults:** respects `prefers-reduced-motion`, works with server rendering, and never shifts layout.

## Packages

| Package              | Status      | Purpose                                                                                                                                                                                                                      |
| -------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@veilo-ui/core`     | 0.7.0       | Effects engine: settings schema, easing, grid sampling, renderers, controller ([README](packages/core/README.md))                                                                                                            |
| `@veilo-ui/css`      | 0.7.0       | CSS-only loaders: a ready stylesheet and a CSS generator ([README](packages/css/README.md))                                                                                                                                  |
| `@veilo-ui/presets`  | 0.7.0       | The named presets as typed data ([README](packages/presets/README.md))                                                                                                                                                       |
| `@veilo-ui/react`    | 0.7.0       | React components: `Reveal`, `Skeleton` and `useReveal`, with server rendering ([README](packages/react/README.md))                                                                                                           |
| `@veilo-ui/vue`      | 0.7.0       | Vue 3 components `Reveal` and `Skeleton` and a `useReveal` composable, typed for script setup ([README](packages/vue/README.md))                                                                                             |
| `@veilo-ui/svelte`   | 0.7.0       | Svelte 5 components `Reveal` and `Skeleton` and the `reveal` and `skeleton` actions ([README](packages/svelte/README.md))                                                                                                    |
| `@veilo-ui/angular`  | 0.7.0       | Angular 20 to 22 standalone components and directives, running outside the zone ([README](packages/angular/README.md))                                                                                                       |
| `@veilo-ui/element`  | 0.7.0       | Web components `<veilo-reveal>` and `<veilo-skeleton>`, and a one-file CDN bundle for plain HTML ([README](packages/element/README.md))                                                                                      |
| `@veilo-ui/seasonal` | 0.8.0       | Seasonal loading animations drawn with text characters: snowflakes, frost and aurora for Christmas and New Year. A function, a React component and a web component ([README](packages/seasonal/README.md))                   |
| `@veilo-ui/ui`       | internal    | Design tokens and React components for the playground and website (never published)                                                                                                                                          |
| `playground`         | staging     | The online tool ([staging site](https://veilo-playground.vercel.app)): test card with five layouts, image source and ratio, transport bar, presets of your own, share links, curve editor, code for every package, themes    |
| `docs`               | in progress | The docs ([Astro Starlight](https://starlight.astro.build/)): getting started, concepts, a guide per framework, the generated settings reference and an effects page for every preset, with live previews (not deployed yet) |

```ts
import { createReveal } from "@veilo-ui/core";

const reveal = createReveal(document.querySelector(".card"), { imageFx: "dots" });
reveal.playSequence();
```

## How it is built

- **Language and repo:** TypeScript (strict), a pnpm workspace with Turborepo.
- **Core:** framework-agnostic TypeScript with no dependencies; canvas and CSS rendering. Every frame is a pure function of progress `p` (0 to 1), so scrubbing and tests are exact.
- **Playground:** Vite, React 18, Zustand, Radix UI and CSS Modules on Veilo design tokens.
- **Builds and tests:** tsdown (ESM, CommonJS and types), Vitest in Node and headless Chromium, Testing Library, lightningcss checks, and Playwright screenshots of every preset in light and dark.
- **Release:** Changesets (one shared version for all packages), Conventional Commits, GitHub Actions CI. The playground is hosted on Vercel.

## Repository layout

```
apps/       playground (docs and website later)
packages/   core, css, presets, react, vue, svelte, angular, element, ui
examples/   css-demo, react-demo, vue-demo, svelte-demo, angular-demo, element-demo, snippet-check
tools/      layer-check, lint (internal)
docs/       SPEC.md, the product specification
```

## Development

```powershell
pnpm install
pnpm --filter website dev     # run the website (home and playground)
pnpm test                        # all tests
pnpm lint; pnpm typecheck; pnpm build
pnpm --filter website visual  # screenshot tests in Docker (see CONTRIBUTING.md)
```

Browser tests need Chromium once per machine: `pnpm --filter @veilo-ui/core exec playwright install chromium`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
