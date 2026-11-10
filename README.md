# Veilo

Veilo is a free, open-source playground and package family for **skeleton loaders** (the placeholder shown while content loads) and **reveal animations** (the transition from placeholder to real content, for images and text).

Tune an effect with live controls, scrub it frame by frame, and export it as CSS or JSON. The same settings object drives a framework-agnostic engine that runs in plain HTML or any framework.

> **Status:** early development, version 0.3.0. The core engine, the CSS loaders and the first playground are done; the playground runs on a staging site at https://veilo-playground.vercel.app. Nothing is published to npm yet, and the API can still change before 1.0.

## What it does

- **Skeleton loaders:** shimmer, wave and pulse, from CSS alone or driven by JavaScript.
- **Image reveals:** dot, hex, binary and mosaic grids sampled from the real photo, plus crossfade, blur-up, zoom and wipe.
- **Text reveals:** scramble, typewriter, rise and fade, with a fading button background.
- **Plain JSON settings:** one versioned settings object, validated by a JSON Schema, shared by the playground, the exports and the packages.
- **Accessible defaults:** respects `prefers-reduced-motion`, works with server rendering, and never shifts layout.

## Packages

| Package          | Status   | Purpose                                                                                                                                            |
| ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@veilo/core`    | 0.3.0    | Effects engine: settings schema, easing, grid sampling, renderers, controller ([README](packages/core/README.md))                                  |
| `@veilo/css`     | 0.3.0    | CSS-only loaders: a ready stylesheet and a CSS generator ([README](packages/css/README.md))                                                        |
| `@veilo/presets` | 0.3.0    | The named presets as typed data ([README](packages/presets/README.md))                                                                             |
| `@veilo/ui`      | internal | Design tokens and React components for the playground and website (never published)                                                                |
| `playground`     | staging  | The online tool ([staging site](https://veilo-playground.vercel.app)): test card, image source, transport bar, tabs, presets, curve editor, themes |
| Planned          | —        | `element` (web components), `react`, `vue`, `svelte`, `angular`, docs and website                                                                  |

```ts
import { createReveal } from "@veilo/core";

const reveal = createReveal(document.querySelector(".card"), { imageFx: "dots" });
reveal.playSequence();
```

## How it is built

- **Language and repo:** TypeScript (strict), a pnpm workspace with Turborepo.
- **Core:** framework-agnostic TypeScript with no dependencies; canvas and CSS rendering. Every frame is a pure function of progress `p` (0 to 1), so scrubbing and tests are exact.
- **Playground:** Vite, React 18, Zustand, Radix UI and CSS Modules on Veilo design tokens.
- **Builds and tests:** tsdown (ESM, CommonJS and types), Vitest in Node and headless Chromium, Testing Library, lightningcss checks.
- **Release:** Changesets (one shared version for all packages), Conventional Commits, GitHub Actions CI. Hosting on Vercel is planned.

## Repository layout

```
apps/       playground (docs and website later)
packages/   core, css, ui
examples/   css-demo
tools/      layer-check, lint (internal)
docs/       SPEC.md, the product specification
```

## Development

```powershell
pnpm install
pnpm --filter playground dev     # run the playground
pnpm test                        # all tests
pnpm lint; pnpm typecheck; pnpm build
```

Browser tests need Chromium once per machine: `pnpm --filter @veilo/core exec playwright install chromium`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
