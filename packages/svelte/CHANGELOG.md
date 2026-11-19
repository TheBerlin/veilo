# @veilo-ui/svelte

## 0.7.1

### Patch Changes

- fc06d4e: The packages are now named `@veilo-ui/*` (for example `@veilo-ui/core`), because the `@veilo` scope is taken on npm. Only the package names change: no API, behavior, CSS name or setting changes, and nothing was published under the old names.
- Updated dependencies [fc06d4e]
  - @veilo-ui/core@0.7.1
  - @veilo-ui/presets@0.7.1

## 0.7.0

### Minor Changes

- 56996f6: New package: Svelte 5 bindings. The `reveal` and `skeleton` actions hold the logic, and the `Reveal` and `Skeleton` components are thin wrappers over them. `skeleton` with `self` makes one element a placeholder, as an avatar. Built with `svelte-package`.

### Patch Changes

- Updated dependencies [56996f6]
- Updated dependencies [56996f6]
  - @veilo/presets@0.7.0
  - @veilo/core@0.7.0
