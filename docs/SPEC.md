# Skeleton Lab: Product Specification and Package Plan

Skeleton Lab is a visual playground for designing **skeleton loaders** (the placeholder shown while content loads) and **reveal animations** (the transition from placeholder to real content). A designer or developer tunes an effect with live controls, scrubs it frame by frame, and exports it as CSS or JSON. The same settings then drive a framework-agnostic package that runs in React, Vue, Angular, Svelte, web components, or plain HTML.

This document has three parts:

1. [Product specification](#1-product-specification): what the tool does today, every control, every preset, every state, with exact values and formulas.
2. [Online service plan](#2-online-service-plan): how to turn the prototype into a hosted product.
3. [Package architecture](#3-package-architecture-and-framework-recommendations): how to publish the effects as installable packages.

The prototype is a single self-contained HTML page with no dependencies except two Google Fonts. All numbers below are taken from it.

---

## 1. Product specification

### 1.1 Page layout

| Area | Contents |
| --- | --- |
| Header | Title, one-line description, preset chips |
| Stage (left, sticky on desktop) | The product card under test, centered on a dotted background |
| Transport bar (under the stage) | Playback buttons, loop toggle, reveal scrubber, time readout, state label, image tools |
| Control panel (right, 380 px max) | Three tabs: **Loader**, **Reveal**, **Export** |

Below 900 px the layout becomes one column (stage first, panel below) and the stage stops being sticky. A 16 px minimum side gutter is kept at every width and respects phone safe-area insets.

The page supports light and dark themes. It follows the system setting and also honors an explicit `data-theme="light|dark"` on the root element.

### 1.2 The test card

A fixed 320 px product card (max 100% of its container) with seven animated parts, in DOM order:

| Index (`--i`) | Part | Skeleton bar width |
| --- | --- | --- |
| 0 | Square image area | Full |
| 1 | Heading: "MCHOSE L7 Pro" | 58% |
| 2 | Description line 1: "Lightweight 8K polling mouse with" | 96% |
| 3 | Description line 2: "tri-mode wireless and a 60 g shell." | 70% |
| 4 | Price: "$59.99" | 28% |
| 5 | Old price: "$79.99" (struck through) | 20% |
| 6 | Button: "Buy now" (full-width, 42 px high) | Full |

The index is exposed as the CSS custom property `--i` and drives the wave effect's per-element delay.

Real text stays in the layout during every animation so nothing shifts. Skeleton bars are drawn on a `::before` pseudo-element inset by `0.18em` top and bottom, so bars are thinner than the line height.

The card is interactive: **click**, **Enter**, or **Space** on it replays the full sequence. It has `role="button"` and an accessible label.

### 1.3 Image source

- **Default image:** a mouse drawn on a canvas at runtime (dark body, teal side stripe, scroll wheel, button seams, soft floor shadow, light gradient background). It is dark on a light background, which produces strong contrast for the dot and character grids.
- **Use my own image:** file picker (any `image/*`). The image is read with `FileReader`, drawn **cover-fit** into a square canvas on a white background, then the sequence replays.
- **Drag and drop:** dropping an image file on the image area does the same.
- **Reset image:** returns to the drawn default.
- The photo canvas is sized to the image area's CSS width times the device pixel ratio (capped at 2, minimum 160 px). It is redrawn when the area resizes by 2 px or more.

### 1.4 Playback model and states

The card is always in one of two views.

| View | What the user sees | How it starts |
| --- | --- | --- |
| **Loading** | Skeleton placeholders animating according to the Loader tab. Image canvases hidden. | **Loading state** button, any Loader-tab change, or the start of a sequence |
| **Reveal** | Reveal animation at progress `p` from 0 to 1, driven by the Reveal tab. At `p = 1` all effect layers are removed and the real content is shown. | **Replay reveal**, any Reveal-tab change, the scrubber, or the end of the hold time in a sequence |

**Sequence** = Loading for `hold` seconds, then Reveal for `rDur` seconds. If **Loop** is checked, the sequence restarts 900 ms after the reveal ends.

#### Transport controls

| Control | Behavior |
| --- | --- |
| **Play sequence** (primary) | Cancels everything, shows Loading, waits `hold` seconds (immediately if 0), then plays the reveal |
| **Loading state** | Cancels everything, holds the skeleton. Restarts the loader animation from its first frame. |
| **Replay reveal** | Skips the loading phase and plays the reveal from `p = 0` |
| **Loop** checkbox | Repeats the full sequence after each reveal |
| **Scrubber** (0 to 1000) | Cancels playback, switches to the Reveal view, and renders the exact frame at `p = value / 1000` |
| **Time readout** | `elapsed / total s`, for example `0.84 / 1.04 s` |
| **State label** | `Loading`, `Revealing 42%`, or `Revealed` |

#### What changes trigger

| Changed control | Result |
| --- | --- |
| Any Loader-tab control | Regenerates the loader CSS, then shows the Loading view (animation restarts) |
| Any Reveal-tab control | Rebuilds the sampling grid, then replays the reveal from `p = 0` (no loading phase) |
| A preset chip | Resets **all** settings to defaults, applies the preset's overrides, clears custom colors, rebuilds the controls, then plays the full sequence |
| Image change or reset | Redraws, then plays the full sequence |
| Theme change | Re-reads the glyph ink color and re-renders the current frame |

#### Initial load

The page opens in the Loading view and starts the reveal after `hold` seconds (1.2 s by default). It does not loop by default.

### 1.3 Loader tab (skeleton placeholder)

Placeholders are the image area, the button, and a pseudo-element bar on each text element. All three share one generated animation rule.

#### Effect

| Value | Description |
| --- | --- |
| **Shimmer sweep** | A highlight band travels across each placeholder |
| **Wave, staggered** | Same sweep, but each element starts later than the previous one: `animation-delay = --i × stagger` |
| **Pulse** | The placeholder fades between full opacity and a lower opacity |

#### Controls

| Key | Label | Range / options | Default | Unit | Shown when |
| --- | --- | --- | --- | --- | --- |
| `effect` | Effect | `shimmer`, `wave`, `pulse` | `shimmer` | | always |
| `lDur` | Duration | 0.3 to 4, step 0.05 | 1.2 | s | always |
| `lGap` | Pause between passes | 0 to 2, step 0.05 | 0.2 | s | effect is not `pulse` |
| `lEase` | Easing | see [easing table](#easing-presets) | `out` | | always |
| `lx1`, `ly1`, `lx2`, `ly2` | Curve x1, y1, x2, y2 | x: 0 to 1; y: -0.6 to 1.6; step 0.01 | .22, 1, .36, 1 | | easing is `custom` |
| `repeat` | Repeat | `loop`, `once` | `loop` | | always |
| `stagger` | Delay per element | 0 to 0.4, step 0.01 | 0.12 | s | effect is `wave` |
| `angle` | Sweep angle | 0 to 180, step 5 | 100 | deg | effect is not `pulse` |
| `lWidth` | Highlight width | 8 to 70, step 2 | 30 | % | effect is not `pulse` |
| `depth` | Pulse depth (lowest opacity) | 0.1 to 0.9, step 0.05 | 0.5 | | effect is `pulse` |
| `radius` | Bar corner radius | 0 to 24, step 1 | 6 | px | always |
| colors | Base, Highlight, Reset colors | any `#rrggbb` | theme tokens | | always |

Controls that do not apply to the current effect are hidden, and a group with no visible controls is hidden entirely.

#### Colors

The theme provides defaults:

| Token | Light | Dark |
| --- | --- | --- |
| `--sk-base` | `#dde5e6` | `#27373c` |
| `--sk-hi` | `#f6fafa` | `#3d5259` |

Picking a color overrides the token on the card only. **Reset colors** removes both overrides. Overrides are included in exports as `baseColor` and `highlightColor`.

#### How the shimmer is generated

With `w = lWidth`, `total = lDur + lGap`, `pct = lDur / total × 100`:

```css
background: linear-gradient(<angle>deg,
  base 0%, base calc(50% - w/2), highlight 50%, base calc(50% + w/2), base 100%);
background-size: 300% 100%;
background-position: 100% 0;
animation: sk-sweep <total>s <easing> <delay> <loop|1> both;

@keyframes sk-sweep {
  0%        { background-position: 100% 0; }
  <pct>%    { background-position: 0% 0; }
  100%      { background-position: 0% 0; }   /* this is the pause */
}
```

The gradient is three times wider than the element, so the highlight enters from one side and leaves from the other. Both ends of the gradient are the base color, so the loop restart is invisible.

#### How the pulse is generated

```css
background: <base>;
animation: sk-pulse <lDur>s <easing> <loop|1> both;

@keyframes sk-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: <depth>; }
}
```

The pause control does not apply to pulse.

#### Wave delay

`animation-delay: calc(var(--i, 0) * <stagger>s)`. The index follows the DOM order in the table above, so the wave runs top to bottom through the card.

### 1.4 Reveal tab

Reveal progress `p` runs from 0 to 1 over `rDur` seconds. `E = ease(p)` uses the reveal easing. Three things animate in parallel: the **image**, the **card text**, and the **button background**.

#### Image controls

| Key | Label | Range / options | Default | Shown when |
| --- | --- | --- | --- | --- |
| `imageFx` | Image reveal | `dots`, `hex`, `binary`, `mosaic`, `blur`, `crossfade`, `wipe`, `zoom` | `dots` | always |
| `origin` | Origin | `left`, `right`, `top`, `bottom`, `center`, `diagonal`, `random` | `left` | grid effects or `wipe` |
| `cols` | Grid columns | 16 to 110, step 2 | 64 | grid effects |
| `startScale` | Start scale | 1 to 4, step 0.1 (shown as ×) | 2.5 | grid effects |
| `spread` | Cell stagger spread | 0.1 to 0.9, step 0.05 | 0.6 | grid effects |

"Grid effects" are `dots`, `hex`, `binary`, and `mosaic`.

#### Grid reveal (dots, hex, binary, mosaic)

**Sampling.** The photo canvas is downscaled to `cols × cols` cells (a square grid, because the image area is square). Large images are halved repeatedly before the final step so the average is not aliased. Each cell gets an RGB color and a darkness value `1 - luminance` (Rec. 709 weights: 0.2126, 0.7152, 0.0722).

**Contrast stretch.** Darkness values are normalized so the lightest cell is 0 and the darkest is 1 (the span is at least 0.05). This keeps light backgrounds empty and makes uploaded photos with low contrast usable.

**Cell order** (`order`, 0 to 1, a random generator seeded with 7 so results are repeatable):

| Origin | Order value for a cell at `u = col/(cols-1)`, `v = row/(rows-1)` |
| --- | --- |
| `left` | `u` (whole columns start together) |
| `right` | `1 - u` |
| `top` | `v` |
| `bottom` | `1 - v` |
| `center` | `distance from center / 0.7071 × 0.85 + random × 0.15` (center-out with jitter) |
| `diagonal` | `(u + v) / 2` |
| `random` | random |

**Timeline.** The grid runs on `gp = clamp(p / 0.8)`. Each cell has a local progress:

```
local = (gp - order × spread) / (1 - spread)
```

A cell with `local <= 0` is not drawn. Otherwise `l = clamp(local)`, `scale = lerp(startScale, 1, ease(l))`, and `alpha = min(1, l × 4)`. Higher `spread` means cells start further apart and each one animates for a shorter time.

**Fade to the real photo.** From `p = 0.8` to `p = 1` the real photo fades in with a smoothstep curve while the effect layer fades out. At `p = 1` the effect layer is cleared.

**Drawing per style:**

| Style | Cell drawing |
| --- | --- |
| **Variable-size dots** | Filled circle, radius `cell × 0.5 × scale × (0.2 + 0.8 × darkness)`. Cells with darkness below 0.08 are skipped. Drawn in the theme's ink color. |
| **Hex characters** | One character per cell from `0-9 A-F - _ . ~`, chosen by measured ink density (see below). Font size `cell × 1.15`, scaled by `scale`. Cells below 0.08 darkness are skipped. |
| **Binary characters** | Same, but only `0` and `1`. |
| **Mosaic squares** | Filled square in the cell's actual color, side `cell × scale`. All cells are drawn, including light ones. |

**Measured density ramps.** At first use, each character in the set is drawn at 40 px in IBM Plex Mono onto a small canvas and its total alpha is summed. A 256-entry lookup maps darkness to the character whose ink amount is closest to `darkness × maxInk`. Ramps are recomputed after the monospace font finishes loading, so the result always matches the active font.

#### Non-grid image effects

| Effect | Behavior (with `E` = eased progress, clamped to 0..1 where noted) |
| --- | --- |
| **Crossfade** | Photo opacity = `E` |
| **Blur-up** | Opacity = `E`, `blur((1-E) × 18 px)`, `scale(1 + (1-E) × 0.06)` |
| **Zoom in** | Opacity = `E`, `scale(1 + (1 - ease(p)) × 0.35)` (the zoom term is not clamped, so overshoot easing can briefly go beyond 1) |
| **Wipe** | Clip-path by origin: `left` inset from the right edge, `right` inset from the left, `top` and `bottom` likewise, `center` a circle growing to 75% radius, `diagonal` a triangle growing from the top-left corner. `random` falls back to a fade. |

#### Card text controls

| Key | Label | Options | Default | Shown when |
| --- | --- | --- | --- | --- |
| `textFx` | Text reveal | `scramble`, `typewriter`, `rise`, `fade` | `scramble` | always |
| `charset` | Scramble characters | `hex`, `binary`, `symbols`, `dots` | `dots` | text reveal is `scramble` |
| `unit` | Resolve by | `char`, `word` | `char` | text reveal is `scramble` |

Character sets:

| Set | Characters |
| --- | --- |
| `hex` | `0123456789ABCDEF-_.~` |
| `binary` | `01` |
| `symbols` | `#%&@$*+=?<>/\|` |
| `dots` | `●•∙·` |

**Text timeline.** There are 7 text elements (heading, two description lines, price, old price, button label; the heading is index 0). Each has its own window of length `0.55` of the total timeline, and window starts are spaced `(0.85 - 0.55) / (n - 1)` apart, so the last element finishes at `p = 0.85`. Local text progress is `tp = clamp((p - i × spacing) / 0.55)`, eased with the reveal easing.

| Effect | Behavior |
| --- | --- |
| **Scramble** | The real text is kept (invisible) to reserve layout. An overlay shows random characters from the chosen set, refreshed every 60 ms of reveal time (a deterministic hash of element, character index, and tick, so scrubbing is repeatable). Spaces are never scrambled. In **character** mode, non-space character `k` of `N` resolves when eased progress reaches `(k+1)/N`. In **word** mode, whole words resolve in reading order the same way. |
| **Typewriter** | Overlay shows the first `round(progress × length)` characters, plus a block caret `▍` while the element is mid-animation |
| **Rise and sharpen** | Element fades in while moving up from 10 px below and un-blurring from 3 px |
| **Fade** | Element opacity follows eased progress |

The button's background fades in with its label (`--bg-a` from 0 to 1) for every text effect.

#### Timing controls

| Key | Label | Range / options | Default |
| --- | --- | --- | --- |
| `rDur` | Reveal duration | 0.4 to 5, step 0.05 s | 1.04 |
| `rEase` | Easing | see below | `outSoft` |
| `rx1`, `ry1`, `rx2`, `ry2` | Curve points (when custom) | as above | .33, 1, .68, 1 |
| `hold` | Loading time before reveal | 0 to 5, step 0.1 s | 1.2 |

#### Easing presets

Shared by loader and reveal. Values are CSS `cubic-bezier(x1, y1, x2, y2)`.

| Key | Label | Curve |
| --- | --- | --- |
| `out` | Ease out | 0.22, 1, 0.36, 1 |
| `outSoft` | Ease out, soft | 0.33, 1, 0.68, 1 |
| `inOut` | Ease in-out | 0.65, 0, 0.35, 1 |
| `in` | Ease in | 0.5, 0, 0.75, 0 |
| `linear` | Linear | 0, 0, 1, 1 |
| `back` | Overshoot | 0.34, 1.56, 0.64, 1 |
| `custom` | Custom curve | four sliders |

The reveal uses a JavaScript cubic-bezier solver (Newton's method with a bisection fallback). The loader passes the same curve to CSS.

### 1.5 Presets

Selecting a preset first resets **every** setting to its default, then applies the values below, clears custom colors, and plays the full sequence.

| Preset | Loader | Image reveal | Text reveal | Reveal timing |
| --- | --- | --- | --- | --- |
| **Dot upscale** (the defaults) | Shimmer, 1.2 s, 0.2 s pause, ease out, loop, 100°, 30% | Dots, left, 64 cols, 2.5×, spread 0.6 | Scramble, dots, by character | 1.04 s, ease out soft, 1.2 s hold |
| **Hex from center** | Defaults | Hex, center, 70 cols | Scramble, hex, by word | 1.6 s |
| **Matrix columns** | Defaults | Binary, left, 84 cols | Scramble, binary, by character | 1.4 s |
| **Cascade wave** | Wave, 1 s, 0.4 s pause, 0.12 s stagger | Wipe, left | Rise and sharpen | 1 s, ease out |
| **Soft pulse** | Pulse, 1.4 s, depth 0.45, ease in-out | Blur-up | Fade | 0.9 s, ease out |
| **Compact shimmer** | Shimmer, 1.2 s, no pause, once | Crossfade | Fade | 0.6 s, ease out |
| **Mosaic from edge** | Defaults | Mosaic, diagonal, 36 cols, 1.6×, spread 0.5 | Typewriter | 1.5 s |

"Defaults" means the values in the control tables above.

### 1.6 Export tab

| Section | Contents |
| --- | --- |
| **Settings (JSON)** | Read-only. All current values, plus `baseColor` and `highlightColor` if overridden. **Copy settings** button. |
| **Loader CSS** | Read-only plain CSS: a `.skeleton` class with `color: transparent`, radius, the generated gradient or pulse, and the `@keyframes`. Colors are resolved to hex values. For the wave effect a comment explains how to set `--i` on each element. **Copy CSS** button. |
| **Load settings** | A text box and **Apply settings**. Accepts JSON, applies only known keys with the correct type, restores colors, rebuilds the controls, and plays the sequence. Shows "N settings applied." or "That is not valid JSON." |

The copy buttons use the clipboard API and fall back to selecting the text ("Press Ctrl+C") when the clipboard is blocked.

Example settings JSON (defaults):

```json
{
  "effect": "shimmer", "lDur": 1.2, "lGap": 0.2, "lEase": "out",
  "lx1": 0.22, "ly1": 1, "lx2": 0.36, "ly2": 1,
  "repeat": "loop", "stagger": 0.12, "angle": 100, "lWidth": 30, "depth": 0.5, "radius": 6,
  "imageFx": "dots", "origin": "left", "cols": 64, "startScale": 2.5, "spread": 0.6,
  "textFx": "scramble", "charset": "dots", "unit": "char",
  "rDur": 1.04, "rEase": "outSoft", "rx1": 0.33, "ry1": 1, "rx2": 0.68, "ry2": 1, "hold": 1.2
}
```

### 1.7 Known limits of the prototype

These are the gaps to close when building the service.

- The test card is fixed. Users cannot change its content, size, or layout.
- Only the loader exports as ready-to-use code. Reveal effects export settings only.
- Settings are not saved or shareable by link. Nothing persists between visits.
- The image grid is square only (rows equal columns).
- Reveal effects only run on the card's image and text, not on arbitrary elements.
- The preview ignores `prefers-reduced-motion` on purpose, so effects can still be tested. A real package must honor it.
- Canvas effects run on the main thread. 110 × 110 grids are fine, but very large grids on low-end phones may drop frames.
- The glyph ink color follows the page theme, not a user-chosen color.

---

## 2. Online service plan

### 2.1 Product goals

1. **Design** an effect visually with no code.
2. **Preview** it on the user's own content (their image, their text, their layout).
3. **Export** it as code for any framework, or install it as a package.
4. **Share** it by link and **publish** it to a gallery.

### 2.2 Feature roadmap

**Phase 1: Make the prototype a real app**
- Shareable links: serialize settings to a compact URL fragment (for example, JSON compressed with `lz-string`, then base64url). No server needed.
- Local persistence of the last settings and a "My presets" list.
- Custom content: edit the card text, choose from a few layouts (product card, list row, profile header, article teaser, table row), and set card width.
- Non-square and arbitrary aspect ratios for the image area.
- Export panels for every target (see 2.4).
- Honor `prefers-reduced-motion` in exports and add a preview toggle for it.

**Phase 2: Library and gallery**
- Preset gallery with thumbnails (short looping previews).
- Accounts, saved presets, copy-to-my-library.
- Versioned preset format with a JSON Schema and migration functions.
- Embeddable preview (`iframe` or web component) for docs and blog posts.

**Phase 3: Generalize**
- Apply reveals to any DOM subtree, not just the demo card: user points the tool at a snippet of HTML or a component.
- Timeline editor: multiple tracks (image, each text element) with per-track delay and easing.
- More effects: stripes, noise dissolve, radial sweep, per-letter wave, number counters.
- A/B compare: two presets side by side with synchronized playback.

### 2.3 Recommended app stack

| Concern | Recommendation | Why |
| --- | --- | --- |
| Build tool | **Vite** | Fast dev server, simple static build, first-class TypeScript |
| UI | **React** or **Svelte** | Both fit a controls-heavy tool. Pick the one your team knows. React has the larger pool of contributors and component libraries. Svelte produces smaller bundles. |
| Language | **TypeScript (strict)** | The settings object is the product's core contract |
| State | One typed settings store (Zustand for React, a Svelte store for Svelte) | The prototype has a single flat object. Keep it flat and serializable. |
| Controls | Radix UI primitives (React) or Bits UI (Svelte) for accessible sliders, selects, tabs | Keyboard and screen-reader support out of the box |
| Styling | CSS variables for tokens, plus CSS Modules or Tailwind | The two-theme token structure from the prototype carries over directly |
| Preview engine | The **core package** from section 3, never a copy | The playground must run the exact code users will install |
| Hosting | Cloudflare Pages, Vercel, or Netlify | Static hosting is enough for Phase 1 |
| Backend (Phase 2) | Supabase, or Cloudflare Workers with D1 | Auth, preset storage, gallery. Keep presets as JSON rows. |
| Analytics and errors | Plausible or PostHog, and Sentry | Privacy-friendly usage data and crash reports |
| Tests | Vitest (unit), Playwright (end-to-end and screenshot tests) | See 3.8 |

### 2.4 Export targets

The service should generate, from the same settings object:

| Target | Output |
| --- | --- |
| Plain CSS | The `.skeleton` snippet (already in the prototype) |
| Settings JSON | Versioned preset file |
| Vanilla JS | `import { createReveal } from "@scope/skeleton-core"` plus a code sample using the user's settings |
| React | JSX using `<Skeleton>` and `<Reveal>` with the settings as props |
| Vue | SFC using the Vue components |
| Angular | Standalone component or directive usage |
| Svelte | Component usage |
| Web component | `<sk-reveal preset="...">` snippet |
| CDN | A `<script type="module">` tag that loads from jsDelivr or unpkg |

---

## 3. Package architecture and framework recommendations

### 3.1 Design principle

**Put all logic in one framework-agnostic core. Make every framework package a thin wrapper.**

The prototype already has this shape: settings in, DOM and canvas effects out. The core should not import React, Vue, or Angular, and should not touch `document` at import time (so server-side rendering works).

### 3.2 Packages

Use an npm scope you own (check availability early). Example names:

| Package | Purpose | Depends on |
| --- | --- | --- |
| `@yourscope/skeleton-core` | Effects engine: settings schema, easing, grid sampling, glyph ramps, canvas renderer, text scrambler, timeline, controller | nothing |
| `@yourscope/skeleton-css` | Pure CSS for loaders (shimmer, wave, pulse) as a stylesheet and as a tiny generator function. No JavaScript at runtime. | nothing (optionally core types) |
| `@yourscope/skeleton-presets` | The preset library as typed JSON, with the schema and migrations | core (types only) |
| `@yourscope/skeleton-element` | Web components (`<sk-skeleton>`, `<sk-reveal>`) built on core | core |
| `@yourscope/skeleton-react` | React components and hooks | core |
| `@yourscope/skeleton-vue` | Vue 3 components and composables | core |
| `@yourscope/skeleton-angular` | Angular standalone components and directives | core |
| `@yourscope/skeleton-svelte` | Svelte components | core |

A single umbrella package is also reasonable early on (`@yourscope/skeleton` with subpath exports such as `/react` and `/vue`). Split it later if install size or peer dependencies become a problem.

**Why a CSS-only package matters.** The loaders (shimmer, wave, pulse) need no JavaScript. Many users only want those, and a CSS file works in every framework, in server-rendered pages, and with no hydration cost.

### 3.3 Core API sketch

```ts
import { createReveal, createSkeleton, presets } from "@yourscope/skeleton-core";

// Loader only
const sk = createSkeleton(element, { effect: "wave", duration: 1, stagger: 0.12 });
sk.start();      // adds the skeleton state
sk.stop();       // removes it

// Reveal (image + text)
const reveal = createReveal(container, {
  ...presets["dot-upscale"],
  image: { fx: "dots", origin: "left", cols: 64, startScale: 2.5, spread: 0.6 },
  text:  { fx: "scramble", charset: "dots", unit: "char" },
  duration: 1.04,
  easing: "outSoft",
});

reveal.play();                 // returns a promise that resolves at p = 1
reveal.seek(0.5);              // render the frame at progress 0.5
reveal.pause(); reveal.resume();
reveal.on("progress", p => {});
reveal.on("complete", () => {});
reveal.destroy();              // cancel frames, remove canvases, restore DOM
```

Design rules for the API:

- **Settings are plain JSON.** The playground's export and the package input are the same object, validated by one JSON Schema. Add a `version` field now.
- **Everything is a function of progress.** `render(p)` is pure given the settings and the sampled grid. This is what makes scrubbing, pausing, and tests possible. Keep it.
- **Separate "prepare" from "render".** Sampling the image into a grid and measuring glyph ramps is the expensive step. Do it once, cache it, and reuse it per frame.
- **No global state.** Each instance owns its canvases and timers.
- **Clean up.** `destroy()` must cancel `requestAnimationFrame` and timeouts and observers, and restore the original DOM.

### 3.4 Framework wrappers

**React**

```tsx
<Skeleton loading={isLoading} effect="wave">
  <ProductCard {...product} />
</Skeleton>

<Reveal ready={!isLoading} preset="dot-upscale" onComplete={...}>
  <ProductCard {...product} />
</Reveal>

const reveal = useReveal(ref, settings); // imperative control
```

- Use `useLayoutEffect` / `useEffect` only to create and destroy core instances.
- Support React 18 Strict Mode (effects run twice in development): creation must be idempotent and `destroy()` safe.
- Support server rendering and React Server Components by marking client components with `"use client"`. Server output should be the skeleton markup, so there is no layout shift.

**Vue 3**: components plus composables (`useReveal`). Use `onMounted` and `onBeforeUnmount`. Ship types for `<script setup>` users.

**Angular**: standalone components and a directive, for example `<div skReveal [ready]="loaded" preset="dot-upscale">`. Run animations **outside Angular's zone** (`NgZone.runOutsideAngular`) so each animation frame does not trigger change detection. Build with **ng-packagr** so the output follows the Angular Package Format and installs cleanly for Angular users.

**Svelte**: components, plus an action (`use:reveal={settings}`).

**Web components**: build with **Lit** (small, standards-based). They also give Angular, Vue, and plain-HTML users a zero-wrapper option.

### 3.5 Build and tooling

| Concern | Recommendation |
| --- | --- |
| Language | TypeScript, `strict: true` |
| Monorepo | **pnpm workspaces** with **Turborepo** (simple and fast), or **Nx** if you expect many packages and want generators |
| Bundling libraries | **tsup** (esbuild-based) or **Vite library mode** for core, CSS, React, Vue, Svelte, element packages. **ng-packagr** for Angular. |
| Output formats | ESM and CJS, with type declarations (`.d.ts`) |
| `package.json` | Use `"exports"` with `import`, `require`, and `types` conditions. Set `"sideEffects": false` (CSS files listed explicitly) so bundlers can tree-shake. Mark React, Vue, Angular, and Svelte as `peerDependencies`. |
| Versioning and publishing | **Changesets** for per-package versions and changelogs. Publish with npm provenance from CI (GitHub Actions). |
| Lint and format | ESLint and Prettier (or Biome) |
| CDN | Published packages are available automatically on jsDelivr and unpkg. Provide a single IIFE/ESM bundle for `<script>` use. |
| Bundle size | Track with `size-limit` in CI. Keep the core small and make heavy effects (grids, glyph ramps) separate entry points so the CSS-only and fade effects stay tiny. |
| License | MIT is the common choice for adoption |

### 3.6 Plain-project usage (no framework)

```html
<!-- CSS-only loader -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@yourscope/skeleton-css/skeleton.css">
<div class="sk sk-shimmer" style="width:200px;height:20px"></div>

<!-- Full reveal through a web component -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@yourscope/skeleton-element"></script>
<sk-reveal preset="dot-upscale">
  <img src="product.png" alt="Product">
  <h3>MCHOSE L7 Pro</h3>
</sk-reveal>
```

### 3.7 Quality requirements for a public package

**Accessibility**
- Honor `prefers-reduced-motion: reduce`: replace sweeps and scrambles with a static placeholder and a plain fade (or nothing).
- While loading, put `aria-busy="true"` on the region. Skeleton bars should be `aria-hidden`.
- Scrambled overlay text must be `aria-hidden`. The real text stays in the DOM, so screen readers read the final content.
- Keep contrast reasonable for skeleton bars in both light and dark themes.

**Performance**
- Use `transform` and `opacity` or background-position for CSS loaders. Avoid animating layout properties.
- Cap the device pixel ratio (the prototype caps at 2).
- Pause animation when the element is off-screen (`IntersectionObserver`) and when the tab is hidden.
- Consider `OffscreenCanvas` in a worker for large grids, behind a feature check.
- Reuse sampled grids and ramps. Do not re-measure per frame.

**SSR and hydration**
- No `window` or `document` access at import time.
- Render the skeleton markup on the server so there is no layout shift.
- Keep real content in the layout while loading (the prototype's approach), so dimensions never change when the reveal runs.

**Layout stability**
- Overlay text and canvases must be absolutely positioned and never change the size of the host element.

**Theming**
- Expose CSS custom properties (`--sk-base`, `--sk-hi`, `--sk-radius`, `--sk-ink`) so users restyle without touching code.

**Security**
- Never inject user content with `innerHTML`. Text overlays use `textContent`.
- Validate imported settings against the schema, and clamp numeric ranges to the documented limits.

### 3.8 Testing

| Level | Tool | What to test |
| --- | --- | --- |
| Unit | Vitest | Easing solver, order generation per origin, ramp mapping, scramble resolve order, settings validation and migration |
| Deterministic frames | Vitest + `@napi-rs/canvas` or a browser runner | `render(p)` at fixed `p` values for each effect produces a stable image |
| Component | Testing Library (React, Vue, Svelte), Angular TestBed | Mount, replay, unmount without leaks, Strict Mode safety |
| End to end and visual | Playwright | Screenshot at `p = 0, 0.25, 0.5, 0.75, 1` for every preset in light and dark; reduced-motion behavior |
| Package install | A CI job that installs the built tarballs into minimal React, Vue, Angular, Svelte, and plain-HTML apps and builds them | Catches broken `exports` maps and missing types |
| Bundle size | size-limit | Guards against accidental growth |

Because the effect is a pure function of progress, screenshot tests at fixed progress values are stable and cheap. This is the biggest testing advantage of the current design.

### 3.9 Documentation site

Use **Astro Starlight** or **VitePress**. Each effect gets a page with the live playground embedded (the same core), the settings table, code samples for every framework, and a copy button. Add **Storybook** only if you also want component-level visual review for the wrapper packages.

### 3.10 Suggested repository layout

```
skeleton-lab/
├─ apps/
│  ├─ playground/        # the online service (Vite + React or Svelte)
│  └─ docs/              # Starlight or VitePress
├─ packages/
│  ├─ core/              # effects engine
│  ├─ css/               # CSS-only loaders
│  ├─ presets/           # typed preset JSON + schema + migrations
│  ├─ element/           # web components (Lit)
│  ├─ react/
│  ├─ vue/
│  ├─ svelte/
│  └─ angular/           # built with ng-packagr
├─ examples/             # minimal React, Vue, Angular, Svelte, plain HTML projects
├─ .changeset/
├─ turbo.json
└─ pnpm-workspace.yaml
```

### 3.11 Suggested build order

1. Extract the prototype's logic into `core` as pure TypeScript modules: `easing`, `grid` (sampling and ordering), `ramps`, `render-grid`, `render-text`, `timeline`, `controller`. Add unit tests as you go.
2. Define the settings schema (JSON Schema and TypeScript types) with a `version` field.
3. Build `css` (generator and static stylesheet) and check it against the playground's current output.
4. Rebuild the playground on top of `core` so it uses the published code path.
5. Add `react` first (largest audience), then `element`, `vue`, `svelte`, and `angular`.
6. Add the install-and-build CI job for every framework example.
7. Publish `0.x` versions, gather feedback, then freeze the settings schema for `1.0`.

---

## 4. Glossary

| Term | Meaning |
| --- | --- |
| Skeleton / loader | Placeholder shapes shown while content loads |
| Reveal | The transition from placeholder to real content |
| Progress (`p`) | Reveal position from 0 to 1 |
| Grid effect | A reveal that samples the image into a grid of cells (dots, hex, binary, mosaic) |
| Origin | Where a grid or wipe reveal starts |
| Ramp | A lookup from darkness to the character with the closest measured ink density |
| Hold | Loading time before the reveal starts in a sequence |
| Sequence | Loading for the hold time, then the reveal |
| Preset | A named set of all settings |
