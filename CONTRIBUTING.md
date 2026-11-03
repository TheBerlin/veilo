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

Tests use [Vitest](https://vitest.dev/guide/). They live in `test/`, which mirrors `src/` one file to one file:

```sh
pnpm test        # run every package once, skipping unchanged packages
pnpm test:watch  # rerun all packages as you edit
```

Lint with [ESLint](https://eslint.org/docs/latest/). Every export in `packages/*/src` needs a [TSDoc](https://tsdoc.org/) comment, and exported functions need `@param` and `@returns`. Declare exports inline, as a function exported later through `export { name }` skips those two checks:

```sh
pnpm lint
```

Format code with [Prettier](https://prettier.io/docs/) before pushing:

```sh
pnpm format        # rewrite files
pnpm format:check  # report unformatted files without changing them
```

## Core layers

`packages/core/src` is split into layers, and a layer imports only from the layers below it:

| Layer | Folders                     | May import     | Environment                                                                 |
| ----- | --------------------------- | -------------- | --------------------------------------------------------------------------- |
| 0     | `schema`, `math`            | Nothing        | Pure, runs anywhere                                                         |
| 1     | `grid`, `timeline`, `dom`   | Layer 0        | `dom` is the only browser access; `grid/sample` and `grid/ramps` may use it |
| 2     | `render`, `loader`, `slots` | Layers 0 and 1 | DOM and canvas, draws one frame at progress `p`, no timers                  |
| 3     | `controller`                | Everything     | The only layer with state, timers and observers                             |

- `schema` and `math` may share types, but not values.
- Folders in the same layer stay independent.
- `src/index.ts` (`@veilo/core`) and `src/loader-entry.ts` (`@veilo/core/loader`) are the only
  public entries, and nothing inside `src` imports them. The grid renderer is loaded with
  `import()` so it stays out of the main entry; `pnpm --filter @veilo/core check:entries` checks
  the built entries in Node.
- Only `src/dom/` may touch `window` or `document`.
- "State" means the animation: the clock, timers, the sequence and the cached prepared grid live
  in `controller`. Small handles from lower layers (`createSkeleton`, the `dom` watchers, the
  cleanup list) may keep their own state, as long as the controller creates and destroys them.
  Module-level state is never allowed.
- Every file starts with a short comment naming its purpose and layer.

CI enforces the import and browser rules. Run the same check locally:

```sh
pnpm check:layers
```

## Workflow

1. Fork the repository and create a branch from `main` (for example `feat/hex-ramp` or `fix/scrub-seek`).
2. Make focused changes with tests where it makes sense.
3. Run lint, type checks, and tests before pushing.
4. Open a pull request describing what changed and why. Include screenshots or recordings for visual changes.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/), for example `feat(core): add mosaic origin`, `fix(css): remove pulse flicker`, `docs: clarify settings schema`.

A `commit-msg` hook checks every message with [commitlint](https://commitlint.js.org/) and rejects it if it fails. `pnpm install` sets the hook up. The type must be lowercase and one of `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style` or `test`. The subject must not start with a capital or end with a full stop, and body lines can be at most 100 characters.

## Design rules for code

- Keep all logic in the framework-agnostic core. Framework packages stay thin wrappers.
- Settings are plain JSON and validated against the schema; clamp numeric values to documented ranges.
- Rendering is a pure function of progress `p`. Separate expensive preparation (sampling, glyph ramps) from per-frame rendering.
- No global state and no `window` or `document` access at import time.
- `destroy()` must cancel frames, timers, and observers, and restore the DOM.
- Use `textContent`, never `innerHTML`, for user content.
- Honor `prefers-reduced-motion`, keep overlays `aria-hidden`, and never change the host element's size.

## Releases

Versioning and changelogs use [Changesets](https://changesets.dev/). All `@veilo/*` packages share one version. If your change affects a package, run `pnpm changeset`, choose the bump type, and commit the file it creates in `.changeset/`.

While the version is below 1.0.0, a breaking change is a `minor` bump, not a `major` one.

## Reporting bugs

Please include the settings JSON, the framework and browser, and steps to reproduce.
