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

## Visual tests

The playground has screenshot tests with [Playwright Test](https://playwright.dev/docs/test-snapshots) in `apps/website/e2e/`: every preset at progress 0, 0.25, 0.5, 0.75 and 1 plus its Loading view, in the dark and light themes, and the reduced-motion checks. The playground page (`/playground`) opens paused on a frame with `?preset=<id>&p=<0..1>`.

Baselines are made only in the [official Playwright Docker image](https://playwright.dev/docs/docker), the same Linux that CI uses, because fonts render differently on each OS. Start Docker Desktop, then:

```sh
pnpm --filter website visual          # compare with the baselines
pnpm --filter website visual:update   # write new baselines after an intended change
```

The scripts copy the repository into the container (your `node_modules` stays untouched) and write back only `e2e/__screenshots__/`, `playwright-report/` and `test-results/`. Nothing writes a baseline without `--update-snapshots`, so a run outside Docker fails on a missing baseline instead of creating one for the wrong OS. `pnpm e2e` runs the tests on your own OS, which is useful for checks that take no screenshot; for a single spec without writing anything, run `pnpm exec playwright test e2e/<file> --update-snapshots=none` in `apps/playground`.

After `visual:update`, review the changed PNGs in the git diff before committing them, and commit them together with the change that caused them. Screenshot names come from `e2e/support/baselines.ts`; `e2e/baselines.spec.ts` fails when a baseline has no screenshot (for example after renaming a preset) or a screenshot has no baseline. Delete orphans by hand.

When the `e2e` job fails in CI, open the run's summary and download the `playwright-report` artifact. Unzip it and run `pnpm --filter website exec playwright show-report <unzipped folder>/playwright-report`; each failed screenshot shows the expected, actual and diff images side by side.

## Size budget

Growth is checked in CI after the build, with the sizes gzipped. The packages are measured with [size-limit](https://github.com/ai/size-limit): the limits are in `.size-limit.json`, each about 10% above the size when set, and the files are measured as built (not minified), so the numbers are for watching growth, not what a bundler ships. The website has its own check, because its files have hashed names: `apps/website/scripts/check-size.mjs` limits the first-load JavaScript and CSS, the lazy grid chunk, and every clip, poster and image. The docs have one too, `apps/docs/scripts/check-size.mjs`.

```sh
pnpm build
pnpm size                  # the packages
pnpm --filter website size # the website
pnpm --filter docs size    # the docs
```

When a check fails, first find out why the size grew. Raising a limit means editing `.size-limit.json` or `check-size.mjs` and saying why in the commit message.

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
- `src/index.ts` (`@veilo-ui/core`) and `src/loader-entry.ts` (`@veilo-ui/core/loader`) are the only
  public entries, and nothing inside `src` imports them. The grid renderer is loaded with
  `import()` so it stays out of the main entry; `pnpm --filter @veilo-ui/core check:entries` checks
  the built entries in Node.
- Only `src/dom/` may touch `window` or `document`.
- "State" means the animation: the clock, timers, the sequence and the cached prepared grid live
  in `controller`. Small handles from lower layers (`createSkeleton`, the `dom` watchers, the
  cleanup list) may keep their own state, as long as the controller creates and destroys them.
  Module-level state is never allowed.
- Every file starts with a short `//` comment naming its purpose and layer. Use `//`, not `/** */`:
  a doc comment at the top of a file can end up in the published type declarations. TSDoc
  (`/** */`) is for exports.

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

Versioning and changelogs use [Changesets](https://changesets.dev/). All `@veilo-ui/*` packages share one version. If your change affects a package, run `pnpm changeset`, choose the bump type, and commit the file it creates in `.changeset/`.

While the version is below 1.0.0, a breaking change is a `minor` bump, not a `major` one.

## Reporting bugs

Please include the settings JSON, the framework and browser, and steps to reproduce.
