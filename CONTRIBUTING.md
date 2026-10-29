# Contributing to Veilo

Thanks for your interest in Veilo. This project is in early setup, so the workflow below will grow as the code lands.

## Ground rules

- Be kind and constructive in issues and reviews.
- By contributing, you agree your work is released under the [MIT license](LICENSE).
- Open an issue before starting a large change so we can agree on the approach.

## Development setup

The toolchain is planned as TypeScript (strict), pnpm workspaces, and Turborepo. Once packages exist:

```sh
pnpm install
pnpm build
pnpm test
```

## Workflow

1. Fork the repository and create a branch from `main` (for example `feat/hex-ramp` or `fix/scrub-seek`).
2. Make focused changes with tests where it makes sense.
3. Run lint, type checks, and tests before pushing.
4. Open a pull request describing what changed and why. Include screenshots or recordings for visual changes.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/), for example `feat(core): add mosaic origin`, `fix(css): remove pulse flicker`, `docs: clarify settings schema`.

## Design rules for code

- Keep all logic in the framework-agnostic core. Framework packages stay thin wrappers.
- Settings are plain JSON and validated against the schema; clamp numeric values to documented ranges.
- Rendering is a pure function of progress `p`. Separate expensive preparation (sampling, glyph ramps) from per-frame rendering.
- No global state and no `window` or `document` access at import time.
- `destroy()` must cancel frames, timers, and observers, and restore the DOM.
- Use `textContent`, never `innerHTML`, for user content.
- Honor `prefers-reduced-motion`, keep overlays `aria-hidden`, and never change the host element's size.

## Releases

Versioning and changelogs will use Changesets. If your change affects a published package, add a changeset with `pnpm changeset`.

## Reporting bugs

Please include the settings JSON, the framework and browser, and steps to reproduce.
