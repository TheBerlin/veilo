# Veilo design system

Veilo is the design system for the Veilo website and playground: a tech, black-dominant, monochrome interface on calm near-black and near-white surfaces, with no decoration of its own: the only color and texture come from the images and effects it shows. Build every page from the tokens and components here, and never add a new color, size or radius.

The source of truth in code is `packages/ui`: `src/tokens.ts` is the typed token table, `tokens.css` is generated from it (`pnpm --filter @veilo-ui/ui generate:tokens`), and `src/components/` holds the React components (Radix UI and CSS Modules). Every token is a CSS custom property with the `--veilo-` prefix, for example `--veilo-bg` or `--veilo-space-2`. This document names tokens without the prefix for readability.

## Principles

- Monochrome. Color never carries meaning on its own; the only hues are the status colors, which always come with an icon or dot and a word. Hierarchy comes from fill, shape and size: only the primary action is a solid `accent` fill.
- Flat and quiet. Separate surfaces with `card` fills and `border` hairlines. The only shadow is `shadow-soft`, for raised bars (tabs, segmented bars, pagination) and floating elements; no gradients or blur.
- Content stays put. Placeholders and reveals never change layout; every media frame reserves its final size.
- One system for site and package. The skeleton colors `--veilo-base` and `--veilo-hi` are the same names the packages read, so the site's skeletons sit on its own surfaces. The packages keep neutral gray fallbacks of their own (`#DCDCDC` / `#F7F7F7`), because they must suit any site.

## Content fundamentals

- Voice: direct and calm. Short imperative sentences that say what the product does. Address the reader as "you" only where needed ("See them on your own image and text.").
- Casing: sentence case everywhere. Write the product as `Veilo` in prose and `veilo` lowercase in the header wordmark only.
- Headings: one or two word step titles end with a period ("Design.", "Preview.", "Export."); a heading that asks ends with a question mark ("Ready to design your loading state?").
- No emoji, no exclamation marks, no hype words. Name the thing: "loader", "reveal", "preset".
- Real copy to follow: "Design skeleton loaders and reveal animations, visually." / "Tune loaders and reveals with live controls." / "Copy CSS or JSON, or install a package."
- Never ship build caveats in copy (for example "once the package is built"); use the `Badge` "Coming soon".

## Visual foundations

**Color.** Two themes, `dark` first. Surfaces are calm and eye-friendly: near-black and near-white on one faint cool hue, never pure black or white. Text is softened to about 14:1 on `bg` to cut glare, and both text tones keep WCAG AAA (7:1) on `bg` and `card`. Balance: `bg` about 60%, `card` and `secondary` about 30%, `accent` about 10%. The accent is monochrome: the text color (`#E2E2E7` in dark mode, `#1E1E22` in light mode), with `bg` on it. Three accents are reserved for later and not in use: Signal mint, Warm amber and Soft cyan. Text is `text` or `text-muted` on `bg`, `card` or `secondary`; text on an `accent` fill is `on-accent`. Status uses `info`, `success`, `warning` and `danger` (each with a `-soft` fill), always with an icon or dot and a word, never color alone; the default status uses `secondary` and `text-muted`.

**Theme switching.** Dark is the default. The light theme applies under `prefers-color-scheme: light` unless `<html data-theme="dark">`, and always under `<html data-theme="light">`. The theme switch offers System, Light and Dark, saves the choice in the browser and applies it before the first paint.

**Type.** Set Display in `h1`, `h2`, `h3`, and body in `body-lg`, `body`, `label`, `label-sm`, `caption`. Code is `code` in IBM Plex Mono. The sans family is Geist, loaded from Google Fonts; change `FONTS.sans` in `tokens.ts` to swap it. On the 375 px layout use `h1-mobile` and `h2-mobile` in place of `h1` and `h2`. Each type token is a `font` shorthand (`font: var(--veilo-type-body)`) with a matching `-tracking` token for letter spacing.

**Spacing.** An 8-point scale: `space-1` 8, `space-2` 16, `space-4` 32, `space-8` 64, `space-16` 128, plus control-internal steps `space-0-5` 4, `space-1-5` 12, `space-2-5` 20 and `space-3` 24 used only inside buttons and badges. Sections sit `space-8` apart; inside a section the title, text and media sit `space-1` apart, with `space-2` above a title that follows a label.

**Sizes.** Component heights and icon sizes are tokens too, so no component writes a pixel value by hand: `size-control-sm` 32, `size-control-md` 44, `size-control-lg` 52, `size-chip` 36, `size-tab` 40, `size-badge` 24, icons `size-icon-sm` 16, `size-icon-md` 20, `size-icon-lg` 24.

**Radius.** One rule keeps every corner consistent: the outer radius equals the inner radius plus the padding between them. Every element that holds no other element uses `radius-base` (8 px): buttons, chips, badges, inputs, tabs, pagination controls, the active nav link and skeletons. A surface that holds elements adds its padding to that base.

| Token         | Value | Formula               | Used for                                                                                             |
| ------------- | ----- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `radius-base` | 8     | base                  | Buttons, chips, badges, inputs, tabs, pagination controls, nav links, skeletons, media inside a card |
| `radius-md`   | 16    | base + `space-1` (8)  | Tab bar, segmented bar, pagination bar, code block, standalone video frame                           |
| `radius-lg`   | 24    | base + `space-2` (16) | Cards                                                                                                |
| `radius-xl`   | 40    | base + `space-4` (32) | Panels such as the hero demo and the playground stage                                                |

When the padding is uneven, use the smallest side. A surface placed inside another subtracts the padding instead: media in a card is 24 - 16 = 8, so it uses `radius-base`. Do not nest a card in a card. To change the look, change `radius-base` and recompute the three steps; with 12 px they become 20, 28 and 44. `radius-pill` is only for dots and avatars, and slider tracks and thumbs are round by shape. Focus outlines follow the element's radius, so they need no value of their own. Skeletons made with `@veilo-ui/css` read `--veilo-radius`, which `tokens.css` sets to `radius-base`.

**Borders and elevation.** `border` hairlines (1 px) for decoration; `border-strong` for control outlines and slider tracks. There is one soft shadow, `shadow-soft` (x 0, y 4, blur 64, 10% black), for raised bars such as tabs, segmented bars and pagination, popovers and the hero demo; do not put it on every card. In dark mode it is barely visible, so keep the `border` hairline.

**Imagery and background.** No background decoration: no dot grid, gradients or patterns. Pages and sections sit on plain `bg`; a closing section may sit on a `card`-colored band. Imagery is the product itself: live skeletons and reveals and the photos they draw. The dotted ghost logo is the one dotted mark.

**Layout.** The website (Home, Gallery, 404) is designed on two frames and built on two column grids (`Grid` and `GridCell` in `@veilo-ui/ui`). Desktop is designed at 1440 px (frame 1440 x 1024): a 12-column stretch grid with 120 px margins and 20 px gutters, so content is 1200 px and a column is about 81.7 px. Mobile is designed at 375 px (frame 375 x 812): a 4-column stretch grid with 20 px margins and 8 px gutters, so content is 335 px and a column is about 77.8 px. Between and beyond the frames the column counts stay fixed and the space flexes, so the page never scrolls sideways:

| Viewport          | Grid                      | Side margins                                                                    |
| ----------------- | ------------------------- | ------------------------------------------------------------------------------- |
| 1440 px and wider | 12 columns, 20 px gutters | Content stays 1200 px, centered: 120 px at 1440, wider beyond.                  |
| 901 to 1439 px    | 12 columns, 20 px gutters | Shrink to 32 px (`space-4`), at 1264 px; below that the columns narrow instead. |
| 900 px and below  | 4 columns, 8 px gutters   | 20 px; the columns stretch with the screen.                                     |

The switch at 900 px is the same as the playground's one-column switch (`GRID_BREAKPOINT` in `tokens.ts`). Margins also grow to the phone's safe-area insets. Place every block on whole columns. On desktop the hero splits 6 and 6 columns, the three How it works rows use 4 and 7 columns with one empty column between, the four benefit tiles ("Loading states that stay out of your way.") come in two rows of 8 and 4 columns (the two demos that need room are the wide ones, and the first leads) and gallery tiles take 4. On mobile every block spans 4 columns, including each benefit tile. Row gaps come from the spacing scale; the grid tokens `grid-desktop-*` and `grid-mobile-*` hold the numbers.

The **playground** is a tool and is fluid between the two frames: the stage stretches, the control panel is at most `size-panel` (380 px), and below 900 px the layout becomes one column. Side gutters are at least 16 px at every width and grow to the phone's safe-area insets.

**Motion.** All interface motion comes from three durations and four easing curves (see Motion). Hover, press, focus and toggles take `duration-fast` (150 ms) with `ease-out`. Tab and panel switches and popovers take `duration-base` (250 ms): `ease-out` to enter, `ease-in` to leave, `ease-in-out` to move. Tooltips have their own timing with `ease-hint` (see Tooltip). `duration-slow` (400 ms) is for large surfaces only. Animate `opacity`, `color`, `border-color`, `background-color` and `transform`, never size or position, so content stays put. The loader sweep and videos are the only continuous motion, and their speed and curve are product settings, not these tokens. Honor `prefers-reduced-motion`: the durations drop to 0 ms, placeholders are static `--veilo-base` and videos show their poster.

**States.** Hover: primary at .88 opacity, secondary and chip borders turn `accent`. Pressed: shift down 1 px. Focus-visible: a solid 2 px `accent` outline with a 2 px offset on every interactive element. Disabled: .4 opacity. Loading: a skeleton in the shape of the content.

**Links.** Links in body copy are always underlined; nav links are identified by position and the active page by an inverted pill.

## Page structure

The site has three pages: Home, Playground and Gallery, all with the Nav, plus a 404 page. On Home, in order: hero (headline, supporting text, primary and secondary CTA, install command, live demo card), demo panel of three effects, How it works (Design, Preview, Export with videos and the install command), the benefits section (four live demo tiles: layout stays put, CSS-only loaders, your framework, reduced motion), the gallery preview (an h2 "Browse the gallery." with a "Browse gallery" button on its row, then three live tiles of four columns: Hex from center, Cascade wave and Mosaic from edge; a tile rests on one frame of its effect, or the still skeleton for a loader, and plays once on hover, keyboard focus or a press; its badges come from the preset's own settings and its "Open in Playground" link is `/playground?preset=<id>`; on a phone one tile and the button at full width), final CTA, footer. The primary action everywhere is "Open Playground"; the secondary is "Browse gallery".

## Iconography

No icon set is chosen yet. When one is, use single-ink line icons at 24 px, inline SVG so they take `currentColor`, with a text label beside any icon that carries meaning. Buttons and badges use inline 16 to 24 px line glyphs (plus, chevrons, minus circle, spinner, check circle, triangle alert, x circle). The logo lives in `assets/Logo/`.

## Footer

The footer is built (`apps/website/src/site/site-footer.tsx`): "Made by" and the author's name linking to the GitHub profile, navigation links (Playground, Gallery, GitHub), and the license line "MIT License". One row above 900 px, wrapping on a phone; side padding matches the Nav's. MIT is a permissive open-source license: anyone may use, change, distribute and sell the software, including in commercial projects, as long as the copyright and license notice are kept.

## Tokens

Every value below comes from `packages/ui/src/tokens.ts`. Colors have a dark and a light value.

### Color

| Token                   | Dark        | Light       | Usage                                                                                                                                                          |
| ----------------------- | ----------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--veilo-bg`            | `#16161A`   | `#F1F1F3`   | Page background, the 60% of the 60:30:10 balance. Ground for text, text-muted, accent and on-accent.                                                           |
| `--veilo-card`          | `#1D1D22`   | `#E8E8EB`   | Panels, the hero demo, video frames and gallery tiles (the 30%). Always sits on bg; add a border hairline in dark, where the step from bg is small.            |
| `--veilo-secondary`     | `#26262C`   | `#DDDDE1`   | Secondary buttons, chips at rest, code blocks, badges. Sits on bg or card. Text on it is text or text-muted.                                                   |
| `--veilo-border`        | `#303037`   | `#D0D0D6`   | Decorative hairlines around cards, nav and dividers. Not for control outlines (too faint); use border-strong for those.                                        |
| `--veilo-border-strong` | `#72717E`   | `#6E6D7A`   | Outlines of controls (secondary button, chip, input) and the slider track. At least 3:1 on bg, card and secondary in both themes.                              |
| `--veilo-text`          | `#E2E2E7`   | `#1E1E22`   | Headings and body copy on bg, card and secondary. Never pure white or pure black; about 14:1 on bg, AAA on every surface.                                      |
| `--veilo-text-muted`    | `#A9A8B6`   | `#4A4A53`   | Captions, helper text and labels on bg, card and secondary (AAA, at least 7:1, on bg and card; at least 4.9:1 on secondary; a test enforces both).             |
| `--veilo-accent`        | `#E2E2E7`   | `#1E1E22`   | The one accent, monochrome: the text color (the 10%). Primary button fill, chosen chip fill, focus ring, logo dots. Keep solid fills to a few places per page. |
| `--veilo-on-accent`     | `#16161A`   | `#F1F1F3`   | Text and icons on an accent fill.                                                                                                                              |
| `--veilo-base`          | `#26262C`   | `#DDDDE1`   | Resting color of skeleton placeholders, equal to secondary. The same custom property `@veilo-ui/core` and `@veilo-ui/css` read.                                |
| `--veilo-hi`            | `#33333A`   | `#F8F8F9`   | Highlight band of the skeleton shimmer. The same custom property the packages read. Raise it slightly if the sweep looks faint.                                |
| `--veilo-grid-dot`      | `#3A3A42`   | `#B8B8BF`   | Grid dots inside the curve editor's unit square. Decorative only; never carries text.                                                                          |
| `--veilo-danger`        | `#E5857F`   | `#B3261E`   | Error text and icon on bg, card and secondary (at least 4.8:1). Always paired with an icon and a word such as 'Error'; never color alone.                      |
| `--veilo-success`       | `#7FC8A0`   | `#1F6B45`   | Success text and icon on bg, card and secondary. Always paired with an icon and a word such as 'Copied'; never color alone.                                    |
| `--veilo-info`          | `#93A3F5`   | `#3B4BBF`   | Processing status text and icon on bg, card, secondary and info-soft. Always with an icon or dot and a word such as 'Processing'.                              |
| `--veilo-warning`       | `#E6B450`   | `#805300`   | Warning status text and icon on bg, card, secondary and warning-soft (at least 4.5:1). Always with an icon or dot and a word such as 'Warning'.                |
| `--veilo-info-soft`     | `#93A3F524` | `#3B4BBF1A` | Soft fill behind an info badge. Pair with info text.                                                                                                           |
| `--veilo-success-soft`  | `#7FC8A024` | `#1F6B451A` | Soft fill behind a success badge. Pair with success text.                                                                                                      |
| `--veilo-warning-soft`  | `#E6B45024` | `#8053001A` | Soft fill behind a warning badge. Pair with warning text.                                                                                                      |
| `--veilo-danger-soft`   | `#E5857F24` | `#B3261E1A` | Soft fill behind an error badge. Pair with danger text.                                                                                                        |

### Type

- **Sans:** `"Geist", system-ui, -apple-system, "Segoe UI", sans-serif`
- **Mono:** `"IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace`

| Style       | Group   | Family | Size / line height | Weight | Letter spacing | Usage                                                                |
| ----------- | ------- | ------ | ------------------ | ------ | -------------- | -------------------------------------------------------------------- |
| `h1`        | Display | sans   | 56px / 60px        | 700    | -0.02em        | Hero headline, one per page.                                         |
| `h1-mobile` | Display | sans   | 40px / 46px        | 700    | -0.02em        | `h1` on the 375 px layout.                                           |
| `h2`        | Display | sans   | 40px / 46px        | 700    | -0.015em       | Section titles such as 'Loading states that stay out of your way.'   |
| `h2-mobile` | Display | sans   | 32px / 38px        | 700    | -0.015em       | `h2` on the 375 px layout.                                           |
| `h3`        | Display | sans   | 28px / 34px        | 700    | -0.01em        | Step titles in How it works (Design., Preview., Export.).            |
| `body-lg`   | Text    | sans   | 20px / 30px        | 400    | none           | Hero and section supporting text.                                    |
| `body`      | Text    | sans   | 16px / 24px        | 400    | none           | Default body copy.                                                   |
| `label`     | Text    | sans   | 16px / 24px        | 500    | none           | Button, tab and nav labels.                                          |
| `label-sm`  | Text    | sans   | 14px / 20px        | 500    | none           | Small buttons, chips, badges, form field labels.                     |
| `caption`   | Text    | sans   | 14px / 20px        | 400    | none           | Captions, helper text and slider ends (0.5x, 2x). Set in text-muted. |
| `code`      | Code    | mono   | 14px / 22px        | 400    | none           | Install commands, CSS and JSON snippets.                             |

### Spacing

| Token       | Value   | Usage                                                                                     |
| ----------- | ------- | ----------------------------------------------------------------------------------------- |
| `space-1`   | `8px`   | Tight gaps: title to text, text to media, icon to label, chip gaps.                       |
| `space-2`   | `16px`  | Card padding, gap between a CTA pair, control padding, label to title.                    |
| `space-4`   | `32px`  | Panel padding, gaps between stacked blocks inside a section.                              |
| `space-8`   | `64px`  | Gap between page sections and between the How it works steps.                             |
| `space-16`  | `128px` | Space above the hero headline.                                                            |
| `space-0-5` | `4px`   | Icon-to-label gap in small buttons. Inside controls only.                                 |
| `space-1-5` | `12px`  | Left padding of small icon buttons and status badges. Inside controls only.               |
| `space-2-5` | `20px`  | Left padding of medium icon buttons. Inside controls only.                                |
| `space-3`   | `24px`  | Side padding of medium buttons; left padding of large icon buttons. Inside controls only. |

### Size

| Token                          | Value                    | Usage                                               |
| ------------------------------ | ------------------------ | --------------------------------------------------- |
| `size-control-sm`              | `32px`                   | Small buttons, select, color swatch.                |
| `size-control-md`              | `44px`                   | Medium buttons (default).                           |
| `size-control-lg`              | `52px`                   | Large buttons.                                      |
| `size-chip`                    | `36px`                   | Chips.                                              |
| `size-tab`                     | `40px`                   | Tabs.                                               |
| `size-badge`                   | `24px`                   | Compact badges (versions, "Coming soon", eyebrows). |
| `size-icon-sm` / `-md` / `-lg` | `16px` / `20px` / `24px` | Icons in small, medium and large controls.          |
| `size-panel`                   | `380px`                  | Maximum width of the playground's control panel.    |
| `size-test-card`               | `320px`                  | Width of the playground's test card.                |
| `size-test-card-button`        | `42px`                   | Height of the test card's button.                   |
| `size-card-thumb`              | `64px`                   | List-row card thumbnail.                            |
| `size-card-thumb-sm`           | `40px`                   | Table-row card thumbnail.                           |
| `size-card-avatar`             | `72px`                   | Profile-header card avatar.                         |
| `size-grid-dot`                | `1.5px`                  | Dots of the curve editor's 0.1 grid.                |

### Radius

| Token         | Value                      | Usage                                                                                                                                                                                                                                               |
| ------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `radius-base` | `8px`                      | The one base radius. Every element that holds no other element: buttons, chips, badges, inputs, tabs, pagination controls, the active nav link, skeletons, and media inside a card or panel. Change it first, then recompute the three steps below. |
| `radius-md`   | `16px`                     | radius-base + space-1 (8 px). Surfaces whose content sits 8 px inside: the tab bar, the segmented bar, the pagination bar, the code block (copy button 8 px from the corner) and a standalone video frame.                                          |
| `radius-lg`   | `24px`                     | radius-base + space-2 (16 px). Cards, which have 16 px padding.                                                                                                                                                                                     |
| `radius-xl`   | `40px`                     | radius-base + space-4 (32 px). Panels such as the hero demo and the playground stage, which have 32 px padding.                                                                                                                                     |
| `radius-pill` | `999px`                    | Round dots and avatars only.                                                                                                                                                                                                                        |
| `radius`      | `var(--veilo-radius-base)` | Read by `@veilo-ui/css` skeletons, so they follow radius-base.                                                                                                                                                                                      |

### Shadow

| Token         | Value                             | Usage                                                                                                                                                                                                                      |
| ------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shadow-soft` | `0 4px 64px 0 rgba(0, 0, 0, 0.1)` | Soft elevation (x 0, y 4, blur 64, 10% black) for raised bars such as tabs, segmented bars and pagination, popovers and the hero demo. Not for every card. In dark mode it is barely visible, so keep the border hairline. |

### Duration

| Token           | Value   | Usage                                                                                                                                                                     |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `duration-fast` | `150ms` | Hover, press, focus and toggle changes on buttons, chips, tabs and links. Pair with ease-out. Also the tooltip fade-out.                                                  |
| `duration-base` | `250ms` | Tab and panel switches, and popovers and dropdowns appearing, leaving or moving; the tooltip fade-in. Pair with ease-out to enter, ease-in to leave, ease-in-out to move. |
| `duration-slow` | `400ms` | Large surfaces such as the mobile menu or a dialog. Use sparingly. Also the wait before a tooltip hides.                                                                  |

### Easing

| Token         | Value                              | Usage                                                                       |
| ------------- | ---------------------------------- | --------------------------------------------------------------------------- |
| `ease-out`    | `cubic-bezier(0, 0, 0.2, 1)`       | Entering and state changes: fast start, soft landing. The default curve.    |
| `ease-in`     | `cubic-bezier(0.4, 0, 1, 1)`       | Leaving: slow start, quick exit.                                            |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)`     | Moving between two places on the page, such as a selected-tab fill sliding. |
| `ease-hint`   | `cubic-bezier(0.45, 0, 0.52, 0.9)` | Tooltips fading in and out: a gentle start and a soft landing.              |

### Grid

| Token                  | Value    | Usage                                                                           |
| ---------------------- | -------- | ------------------------------------------------------------------------------- |
| `grid-desktop-width`   | `1440px` | Website desktop frame width (frame 1440 x 1024). Content is at most 1200 px.    |
| `grid-desktop-columns` | `12`     | Desktop column count, stretch. Each column is about 81.7 px.                    |
| `grid-desktop-gutter`  | `20px`   | Desktop gutter between columns. Row gaps use the spacing scale.                 |
| `grid-desktop-margin`  | `120px`  | Desktop side margin at 1440 px, also the nav's side padding. Never below 32 px. |
| `grid-mobile-width`    | `375px`  | Website mobile frame width (frame 375 x 812). Used at 900 px and below.         |
| `grid-mobile-columns`  | `4`      | Mobile column count, stretch. Each column is about 77.8 px.                     |
| `grid-mobile-gutter`   | `8px`    | Mobile gutter between columns.                                                  |
| `grid-mobile-margin`   | `20px`   | Mobile side margin, also the nav's side padding. Content width is 335 px.       |

## Components

Components marked _(planned)_ are specified here but not built yet in `packages/ui`.

### Kbd

Kbd is a keycap (`Kbd` in `@veilo-ui/ui`) that shows a keyboard shortcut next to a control, for example `R` on a Replay button. It is a 20 px square (`size-icon-md`) with a `border-strong` hairline, `text-muted` mono type and `radius-base`.

It only shows the hint. The caller handles the key and names it for assistive technology with `aria-keyshortcuts` on the control. Ignore the shortcut while the user types in a field, and when Ctrl, Cmd or Alt are held (the browser owns those).

### Nav

Nav is the top header (`Nav` in `@veilo-ui/ui`): the brand link, the page links and a trailing slot for controls such as the theme switch.

Pass the current page with `current: true` on one link, which sets `aria-current="page"`. The header is `space-8` (64 px) high with the grid margin as side padding (the same margins as `Grid`: 120 px at 1440, at least 32 px down to 901 px, 20 px at 900 px and below) and a `border` hairline below. The brand is a `brand` node (logo and wordmark) plus a `brandLabel` that names the home link.

- The current link is an inverted `accent` fill with `on-accent` text; other links are plain `text` with a `secondary` hover fill. A link may carry a decorative icon (hidden from screen readers; the label names the link).
- The logo is a single-ink SVG (see Logo); never redraw the ghost in code.
- The theme switch goes in the `trailing` slot as a segmented bar (System, Light, Dark; see Chip). It follows the system theme by default and stores the user's choice. The playground keeps its own switch beside the title.
- At 900 px and below the bar shows the brand and a 44 px menu button; the links and the trailing controls open in a panel under the bar. The button has `aria-expanded` and `aria-controls`; Escape, a tap outside and choosing a link close the panel, and Escape returns focus to the button.

### Button

Button is the action control, in primary, secondary and ghost variants and three sizes (`Button` in `@veilo-ui/ui`).

Provide a visible text label (a verb or short phrase: "Open Playground", "Browse gallery"), or an `aria-label` for an icon-only button (the types require it). Use a `<button>` for actions and `asChild` with an `<a>` for navigation. Corners use `radius-base`.

| Size             | Height               | Side padding | Label      | Icon | With icon (left padding, gap) |
| ---------------- | -------------------- | ------------ | ---------- | ---- | ----------------------------- |
| Small            | `size-control-sm` 32 | 16           | `label-sm` | 16   | 12, 4                         |
| Medium (default) | `size-control-md` 44 | 24           | `label`    | 20   | 20, 8                         |
| Large            | `size-control-lg` 52 | 32           | `label`    | 24   | 24, 8                         |

- Icon-only buttons are squares: 32, 44 or 52. Icon plus label puts the icon on the left.
- Use exactly one primary button per view. It is the only solid `accent` fill beside the chosen chip and the current page. The hero and the final CTA carry the same primary action, "Open Playground".
- Use secondary for the second action in a pair (`space-2` apart) and for toolbar actions. Its `border-strong` outline keeps it visible on `bg` and `card`.
- Use ghost for tertiary actions such as Docs. It has no outline, so do not place it where it must read as a control on its own.
- States: hover lowers primary opacity to .88 and moves the secondary border to `accent`; pressed shifts down 1 px; focus-visible draws a 2 px `accent` outline with a 2 px offset; disabled is .4 opacity.
- Do not use color to say a button is dangerous; use its label.

### Chip

Chip is a compact control with `radius-base` corners, `size-chip` high, in `label-sm`, used as a choice (preset, effect, direction) or as a toggle.

- **Toggle chip** (`Chip`): one chip that turns on and off, with `aria-pressed`.
- **Chip group** (`ChipGroup` with `ChipGroupItem`): a single choice. It is a `radiogroup` with `radio` items and an `aria-label`; exactly one item is chosen, arrow keys move between items, Space or Enter chooses, and pressing the chosen item keeps it chosen. Items wrap with `space-1` gaps. With `followFocus` an arrow key also chooses the item it lands on, as a native radio group does; use it where choosing is cheap (the website's framework switcher), and leave it off where a choice replays an animation or loads settings (the playground's presets).
- **Segmented bar** (`ChipGroup variant="segmented"`): the same chip group inside a raised bar that looks like the tab bar: `card` fill, `border` hairline, `radius-md`, `space-1` padding, `shadow-soft`. Chips inside are transparent and `text-muted` at rest and `text` on hover. A pill with a `secondary` fill and `border` hairline slides under the chosen chip (`duration-base`, `ease-out`; placed without motion on first paint, and still under reduced motion because the duration token is 0), and the chosen chip's label is `text`. Use it for small settings that sit apart from the main controls, such as the theme switch; a test keeps it identical to the tab bar.

Rules:

- In the default group, the chosen chip is an inverted `accent` fill with `on-accent` text, not only a color change, so the state reads without color. Rest is a `secondary` fill with a `border-strong` outline; hover turns the outline `accent`.
- Keep chip labels to one or two words; in the hero demo show exactly three presets.
- Do not use a chip as a navigation link; use the nav link or a button.

### Tabs

Tabs is a segmented bar for switching between views of the same content (the playground's Loader, Reveal, Presets and Export sections, for example), built on Radix Tabs.

Provide the tab list with an `aria-label`, one trigger per view and the matching content panels. Radix handles `role="tablist"`, `aria-selected`, arrow keys, Home and End.

- The bar is a `card` with a `border` hairline, `radius-md` and `shadow-soft`. Tabs are `size-tab` (40 px) high with `radius-base`, so the bar is 8 + 8 padding = 16.
- The selected tab is `text`; its `secondary` fill with a `border` hairline is a pill that slides to the newly selected tab (`duration-base`, `ease-out`; the first placement has no motion). Unselected tabs are `text-muted` and become `text` on hover. State never rests on color alone: the pill marks the selected tab. Segmented chip groups use the same pill. The open panel arrives with a short rise out of a 2 px blur; under reduced motion all of it is instant, because the duration tokens are 0.
- `TabsList stretch` spans the container and the tabs share it evenly, like a segmented control, with `space-0-5` side padding (16 otherwise), `label-sm` labels and `space-0-5` gaps, at every width. The playground panel uses it, because its five tabs do not fit the 380 px panel (or the 375 px layout) at the usual size. Other bars keep the usual size.
- The bar is never wider than its container: tabs that still do not fit wrap onto a second row. It does not scroll, because a scrolling bar would clip the focus ring.
- Keep labels to one or two words and the count to five or fewer. For page navigation use the Nav, not Tabs.

### Pagination _(planned)_

Pagination moves through numbered pages with previous and next buttons, the current page, the total, and an optional page select.

Provide a nav landmark with `aria-label="Pagination"`. The previous and next buttons are small icon buttons with `aria-label`s; they disable at the ends.

- The bar is a `card` with `border`, `radius-md` and `shadow-soft`; its controls use `radius-base`, so the bar is 8 + 8 padding = 16. The previous button is secondary and the next button primary, so the forward action is the one solid `accent` fill. The current page is a 32 px `accent` box with `on-accent` text; the total is an outlined box.
- Show "Page 1 of 10" text for screen readers and as a label; add the page select only when there are more than about ten pages.

### Select

Select is a native `<select>` styled with `border-strong`, `size-control-sm` high, `radius-base`, in `label-sm`, so it keeps platform behavior.

### Slider

Slider is a labelled range control for tuning a numeric setting such as speed or duration, built on Radix Slider (`Slider`; the playground's reveal scrubber is `Scrubber`, the same control from 0 to 1).

Provide a label, `min`, `max`, `step`, and the unit or end values (`0.5x` and `2x`) in the ends row, or the current value beside the label.

- The track is 4 px high in `border-strong` (at least 3:1 on every surface); the filled range and the thumb use `accent`. The thumb is one 16 px circle (`size-icon-sm`) in every browser, with a 2 px `bg` ring so it stands out from the filled track.
- Show the end values in `caption` and `text-muted`; add the current value in the label when it matters, with an `aria-valuetext` that includes the unit.
- Keyboard: arrow keys change the value by one step, Page Up and Page Down by larger steps, Home and End to the ends; focus-visible draws the standard accent outline on the thumb.
- Keep the hero demo to one or two sliders; the full set lives in the playground.

### Toggle

Toggle is an on/off switch (Radix Switch) with a visible label, for settings such as Loop. Use a toggle chip instead when the setting sits among chips.

### Badge _(compact variant built; status badges planned)_

Badge is a small label for versions and status. The compact badge is built (`Badge` in `@veilo-ui/ui`, `outline` or `solid`); the status badges below are not. Status badges use a soft or outlined style and a dot or an icon.

Provide a one to three word label. Status badges take a tone: default, info (Processing), success, warning, danger (Error), in a soft or outlined style, with a dot or a 16 px icon before the label.

- The compact badge is `size-badge` (24 px) high, `radius-base`, `space-1` side padding, in `label-sm`: for version numbers, "Coming soon" and section eyebrows such as "How it works". A solid (`accent`) badge marks one highlighted item at most.
- Status badges are `size-control-sm` (32 px) high with `space-1-5` side padding, in `label-sm`.
- Always show the word and a dot or icon; color alone never carries the status. Use the icon version when the status must be told apart at a glance (Default minus, Processing spinner, Success check, Warning triangle, Error x).
- Soft style (tinted `*-soft` fill, toned text) for tables and lists; outlined style (`border` hairline, `text` label, toned icon or dot with a soft halo) on busy surfaces.
- Use "Coming soon" instead of caveats in public copy. A badge is not interactive; use a chip for filters.

### Card

Card is a flat container on `card` with a hairline border, in a standard size and a large panel size (`Card` in `@veilo-ui/ui`: `size="card" | "panel"`, `raised`, and `as` for `div`, `article`, `section` or `li`).

Provide the content as children. Use the standard card (`radius-lg`, `space-2` padding) for features, tiles and the playground's transport bar and control panel, and the panel (`radius-xl`, `space-4` padding) for the hero demo and the playground stage.

- Cards are always lighter or darker than `bg` by fill; in dark mode the step is small, so keep the `border` hairline.
- Flat by default; add `shadow-soft` only for floating or raised panels. No colored left borders. Do not nest a card inside a card; use `secondary` fills for inner groups.
- Corners follow outer = inner + padding: 8 + 16 = 24 for a card, 8 + 32 = 40 for a panel. Media inside either one uses `radius-base` (outer minus padding).
- A card that waits for content shows a skeleton from `@veilo-ui/css` in the shape of the real content and keeps its final size.

### CodeBlock

CodeBlock shows one command or snippet in monospace with a copy button (`CodeBlock` in `@veilo-ui/ui`).

Provide the text. Add the `$` prompt only for shell commands. The Copy button copies the text and shows "Copied" for about 1.6 seconds; if the clipboard is blocked it shows "Press Ctrl+C" and selects the text.

- Fill is `secondary` with a `border` hairline and `radius-md`, because the copy button sits 8 px inside the corner (8 + 8 = 16); type is `code` in `text`, the prompt in `text-muted`.
- Long lines scroll horizontally inside the block; never wrap a command. Inside a grid the block keeps `min-width: 0`, so it never widens its cell.
- For an example a reader should see in full on a phone, `narrow="wrap"` changes the narrow layout (900 px and below): the Copy button moves above the code, which takes the block's whole width and wraps. Wider screens still scroll. The playground's export blocks keep the default.
- The success label uses `success` together with the word "Copied", never color alone.
- The label swaps from Copy to Copied with a short fade out of a 2 px blur (`duration-fast`).

### TextArea, TextField and ColorField

TextArea is a multi-line input in `code` type with a `border-strong` outline and `radius-base`, for pasting JSON. TextField is one line of `body` type in the same outline, `size-control-sm` tall, for names such as a saved preset's; an `error` marks it invalid with a `danger` border and the message in words under it, in place of its hint. ColorField is a `size-control-sm` color swatch plus a `#rrggbb` text box; an invalid value shows a message and is restored on blur.

### CurveEditor

CurveEditor edits a `cubic-bezier()` easing on a square graph. The playground shows it in the Loader and Reveal tabs only when the easing is Custom curve, starting from the curve chosen before.

- The box is square and as wide as the field. The unit square fills most of it, with y from -0.1 to 1.1 around it for overshoot. A handle beyond that range (for example from imported settings) is drawn at the edge and keeps its real value until moved.
- Drag a handle (pointer capture, a hit area about 32 px across), or focus it and use the arrow keys: 0.01 per press, 0.1 with Shift. Each handle is a slider read as "x 0.22, y 1.00".
- The curve is `accent`, the unit square `border-strong`, the linear diagonal `border`, the box `secondary` with a `border` hairline and `radius-base`. Inside the unit square only, a dot grid in `grid-dot` (`size-grid-dot`) marks every 0.1 of x and y (0.1 to 0.9; none on the square's edges). The CSS value is in a tooltip on an info button in the label row.

### Popover

Popover (Radix Popover, `Popover`, `PopoverTrigger`, `PopoverContent`) holds a small group of related controls that open from a button and close on outside click or Escape, such as the playground's saved presets and Preview options. It is `card` with a `border` hairline, `radius-md` and `shadow-soft`; focus moves into it on open and back to the trigger on close. Keep it to one short task; anything longer belongs in a Drawer.

### Drawer

Drawer (Vaul, `Drawer`) is a modal panel that slides in from the edge for a longer task, such as the playground's Export and Share. It dims the page, traps focus, closes on Escape, overlay click or Close, and returns focus to the opener. Use it when the page behind should not be used meanwhile; otherwise use DockedSheet.

### DockedSheet

DockedSheet (`DockedSheet`) is a non-modal bottom sheet for phones: the page behind stays visible and usable, nothing is hidden from screen readers, and it is a labelled `section`. It takes a `title` and `height` (a share of the screen), slides in with `duration-slow` and `ease-out`, moves focus to Close on open, back to the opener on close, and closes on Escape. The playground uses it for the settings so a slider can be moved while the card stays in view.

### Toaster

Toaster (Sonner, `Toaster` and `toast`) shows short messages that need no decision, with an optional Undo action, such as "Settings reset to the defaults." Render one `Toaster` outside any CSS grid. A message stays up to 10 seconds when it has Undo; never put the only copy of important information in a toast.

### Tooltip

Tooltip (Radix Tooltip, inside one `TooltipProvider`) explains an icon-only control in `caption`, or shows a value on demand, such as the curve editor's `cubic-bezier()`. Never put information only in a tooltip: what it shows must also be available another way, such as the trigger's label or the handles' value text.

| Step                                                 | Time                | Set by                                                        |
| ---------------------------------------------------- | ------------------- | ------------------------------------------------------------- |
| Wait before opening on hover                         | 200 ms              | `delayDuration` on the app's `TooltipProvider`                |
| Fade in                                              | 250 ms, `ease-hint` | `duration-base`                                               |
| Wait before hiding after the pointer or focus leaves | 400 ms              | `hideDelay`, default `TOOLTIP_HIDE_DELAY` (= `duration-slow`) |
| Fade out                                             | 150 ms, `ease-hint` | `duration-fast`                                               |

- Keyboard focus opens it at once. Within 300 ms of one tooltip closing, the next opens without the wait (Radix's `skipDelayDuration`).
- Moving back onto the trigger, or onto the open tooltip, during the hide wait cancels the hide; the next leave starts the wait again. So a tooltip can be reached and read.
- Escape hides it at once, without the wait.
- Under reduced motion both fades are instant. The two waits stay, because they are not motion.

### Grid

Grid is the website's column grid: `Grid` (the row container, full width with its own side margins) and `GridCell` (one block on whole columns), in `@veilo-ui/ui`.

- `GridCell` takes `span` and `start` for desktop (1 to 12; default full width) and `spanMobile` and `startMobile` for mobile (1 to 4; default full width). Out-of-range values are clamped, so a cell never adds a column. A start that would push the span past the edge moves left until it fits.
- `Grid` takes `rowGap` as a spacing token name (such as `space-4`); columns always use the grid gutters.
- `as` picks the element: `Grid as="ul"` with `GridCell as="li"` for lists such as gallery tiles, `section`, `header` or `footer` for page blocks.
- Use one `Grid` per page block, directly under the page, not inside a card: its margins are the page margins. The widths it follows are in the Layout section.
- The playground page does not use it: it is a tool with its own fluid, full-screen layout under the site header.

### VideoFrame _(planned)_

VideoFrame is the rounded frame for looping demo videos and gallery tiles, 16:9 or square.

Provide a `<video>` (muted, loop, playsinline, with a `poster`) or an `<img>`, and an optional `<figcaption>`. Videos autoplay only when the viewer has not asked for reduced motion; otherwise they show the poster.

- The frame is `card` with a `border` hairline and `radius-md`; inside a card or panel it uses `radius-base` instead (outer radius minus padding). It always reserves its aspect ratio, so the page never shifts when the video loads.
- While loading, fill the frame with a skeleton from `@veilo-ui/css` (the same shimmer the package ships).
- Captions are `caption` in `text-muted`, centered when the frame is centered under a step title.
- Do not add play overlays or shadows. Every video has an accessible text equivalent in the nearby heading and caption.

### Skeleton

Skeletons on the site and in the playground come from `@veilo-ui/css` (classes `veilo`, `veilo-shimmer`, `veilo-wave`, `veilo-pulse`, or CSS from its generator). They read `--veilo-base`, `--veilo-hi` and `--veilo-radius` from the tokens, stop under reduced motion, and are never hand-written.

### Motion

Motion is the set of three durations and four easing curves that every interface transition in Veilo uses.

Provide the properties that change and take the timing from tokens, for example `transition: background-color var(--veilo-duration-fast) var(--veilo-ease-out)`. Never write a time or a curve by hand; a test fails on hand-written times, curves, colors and lengths in component styles.

- Animate only `opacity`, `color`, `border-color`, `background-color` and `transform`. Never animate width, height, top or left, so content stays put.
- Use `ease-out` to enter or change state, `ease-in` to leave and `ease-in-out` to move between two places. Tooltips use `ease-hint` and their own waits (see Tooltip).
- Under `prefers-reduced-motion` the three durations drop to 0 ms, so transitions become instant. The skeleton sweep stops and videos show their poster.
- The loader sweep and the reveals are product motion. Their speed and curve are settings in the playground and are not these tokens.

## Assets

### Logo

The Veilo logo is a small, rounded dotted ghost (dot grid, no text) whose right side dissolves into dots. It is a separate mark from the wordmark.

Add the logo as a single-ink SVG on a transparent background, 512x512. Because SVGs shown through `<img>` cannot inherit color, add one file in `accent` ink for each theme (for example `ghost-dark-theme.svg` in #E2E2E7 and `ghost-light-theme.svg` in #1E1E22). Until then the nav shows a plain `accent` square as a stand-in; never redraw the ghost in code.

## Code

- Tokens: `packages/ui/src/tokens.ts` (edit) and `packages/ui/tokens.css` (generated; import `@veilo-ui/ui/tokens.css` once per app).
- Components: `packages/ui/src/components/`, exported from `@veilo-ui/ui`. Preview them with `pnpm --filter @veilo-ui/ui dev`.
- Skeletons: `@veilo-ui/css`.
