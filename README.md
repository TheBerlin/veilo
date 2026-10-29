# Veilo

Veilo (formerly Skeleton Lab) is a visual playground and package family for **skeleton loaders** (the placeholder shown while content loads) and **reveal animations** (the transition from placeholder to real content).

Tune an effect with live controls, scrub it frame by frame, and export it as CSS or JSON. The same settings drive a framework-agnostic core that runs in React, Vue, Angular, Svelte, web components, or plain HTML.

> **Status:** early setup (milestone M0). Nothing is published yet and the API will change.

## Goals

1. **Design** an effect visually with no code.
2. **Preview** it on your own content.
3. **Export** it as code for any framework, or install it as a package.
4. **Share** it by link.

## Design principles

- One framework-agnostic core; every framework package is a thin wrapper.
- Settings are plain, versioned JSON validated by a single schema.
- Every frame is a pure function of progress `p` (0 to 1), which makes scrubbing and screenshot tests stable.
- Loaders work with CSS alone, with no JavaScript at runtime.
- Respect `prefers-reduced-motion`, work with server rendering, and never shift layout.

## Planned packages

| Package | Purpose |
| --- | --- |
| `core` | Effects engine: settings schema, easing, grid sampling, renderers, timeline, controller |
| `css` | CSS-only loaders (shimmer, wave, pulse) |
| `presets` | Preset library as typed JSON, with schema and migrations |
| `element` | Web components built on core |
| `react`, `vue`, `svelte`, `angular` | Thin framework wrappers |

## Planned repository layout

```
veilo/
├─ apps/
│  ├─ playground/
│  └─ docs/
├─ packages/
│  ├─ core/  css/  presets/  element/
│  └─ react/  vue/  svelte/  angular/
├─ examples/
└─ .changeset/
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
