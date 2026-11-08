# Veilo design system

Veilo is the design system for the Veilo website and playground: a tech, black-dominant, monochrome interface where the animated dot grid is the only decoration. Build every page from the tokens and components here, and never add a new color, size or radius.

The source of truth in code is `packages/ui`: `src/tokens.ts` is the typed token table, `tokens.css` is generated from it (`pnpm --filter @veilo/ui generate:tokens`), and `src/components/` holds the React components (Radix UI and CSS Modules). Every token is a CSS custom property with the `--veilo-` prefix, for example `--veilo-bg` or `--veilo-space-2`. This document names tokens without the prefix for readability.

## Principles

- Monochrome. Color never carries meaning on its own; the only hues are the status colors, which always come with an icon or dot and a word. Hierarchy comes from fill, shape and size: only the primary action is a solid `accent` fill.
- Flat and quiet. Separate surfaces with `card` fills and `border` hairlines. The only shadow is `shadow-soft`, for raised bars (tabs, segmented bars, pagination) and floating elements; no gradients or blur.
- Content stays put. Placeholders and reveals never change layout; every media frame reserves its final size.
- One system for site and package. The skeleton colors `--veilo-base` and `--veilo-hi` are the same names the packages read, so the site and the product share one palette.

## Content fundamentals

- Voice: direct and calm. Short imperative sentences that say what the product does. Address the reader as "you" only where needed ("See them on your own image and text.").
- Casing: sentence case everywhere. Write the product as `Veilo` in prose and `veilo` lowercase in the header wordmark only.
- Headings: one or two word step titles end with a period ("Design.", "Preview.", "Export."); a heading that asks ends with a question mark ("Ready to design your loading state?").
- No emoji, no exclamation marks, no hype words. Name the thing: "loader", "reveal", "preset".
- Real copy to follow: "Design skeleton loaders and reveal animations, visually." / "Tune loaders and reveals with live controls." / "Copy CSS or JSON, or install a package."
- Never ship build caveats in copy (for example "once the package is built"); use the `Badge` "Coming soon".

## Visual foundations

**Color.** Two themes, `dark` first. Balance: `bg` about 60%, `card` and `secondary` about 30%, `accent` about 10%. In dark mode the accent is `#F1F1F1`; in light mode `#030303`. Text is `text` or `text-muted` on `bg`, `card` or `secondary`; text on an `accent` fill is `on-accent`. Status uses `info`, `success`, `warning` and `danger` (each with a `-soft` fill), always with an icon or dot and a word, never color alone; the default status uses `secondary` and `text-muted`.

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

When the padding is uneven, use the smallest side. A surface placed inside another subtracts the padding instead: media in a card is 24 - 16 = 8, so it uses `radius-base`. Do not nest a card in a card. To change the look, change `radius-base` and recompute the three steps; with 12 px they become 20, 28 and 44. `radius-pill` is only for dots and avatars, and slider tracks and thumbs are round by shape. Focus outlines follow the element's radius, so they need no value of their own. Skeletons made with `@veilo/css` read `--veilo-radius`, which `tokens.css` sets to `radius-base`.

**Borders and elevation.** `border` hairlines (1 px) for decoration; `border-strong` for control outlines and slider tracks. There is one soft shadow, `shadow-soft` (x 0, y 4, blur 64, 10% black), for raised bars such as tabs, segmented bars and pagination, popovers and the hero demo; do not put it on every card. In dark mode it is barely visible, so keep the `border` hairline.

**Imagery and background.** The only decoration is the dot grid in `grid-dot`: `size-grid-dot` (1.5 px) dots on a 16 px pitch, used in the hero, the final CTA, the playground stage and the 404 page only. The dotted ghost logo and its dissolving right edge echo it.

**Layout.** The website (Home, Gallery, 404) uses two fixed layouts, centered, never fluid. Desktop is 1440 px wide (frame 1440 x 1024): a 12-column stretch grid with 120 px margins and 20 px gutters, so content is 1200 px and a column is about 81.7 px. Mobile is 375 px wide (frame 375 x 812): a 4-column stretch grid with 20 px margins and 8 px gutters, so content is 335 px and a column is about 77.8 px. Place every block on whole columns. On desktop the hero splits 6 and 6 columns, the three How it works rows use 4 and 7 columns with one empty column between, the four "Why it's useful" tiles take 3 columns each and gallery tiles take 4. On mobile every block spans 4 columns except the "Why it's useful" tiles, which take 2 each (2 by 2). Row gaps come from the spacing scale; the grid tokens `grid-desktop-*` and `grid-mobile-*` hold the numbers.

The **playground** is a tool and is fluid between the two frames: the stage stretches, the control panel is at most `size-panel` (380 px), and below 900 px the layout becomes one column. Side gutters are at least 16 px at every width and grow to the phone's safe-area insets.

**Motion.** All interface motion comes from three durations and three easing curves (see Motion). Hover, press, focus and toggles take `duration-fast` (150 ms) with `ease-out`. Tab and panel switches, popovers and tooltips take `duration-base` (250 ms): `ease-out` to enter, `ease-in` to leave, `ease-in-out` to move. `duration-slow` (400 ms) is for large surfaces only. Animate `opacity`, `color`, `border-color`, `background-color` and `transform`, never size or position, so content stays put. The loader sweep and videos are the only continuous motion, and their speed and curve are product settings, not these tokens. Honor `prefers-reduced-motion`: the durations drop to 0 ms, placeholders are static `--veilo-base` and videos show their poster.

**States.** Hover: primary at .88 opacity, secondary and chip borders turn `accent`. Pressed: shift down 1 px. Focus-visible: a solid 2 px `accent` outline with a 2 px offset on every interactive element. Disabled: .4 opacity. Loading: a skeleton in the shape of the content.

**Links.** Links in body copy are always underlined; nav links are identified by position and the active page by an inverted pill.

## Page structure

The site has three pages: Home, Playground and Gallery, all with the Nav, plus a 404 page. On Home, in order: hero (headline, supporting text, primary and secondary CTA, install command, ghost illustration on the dot grid), demo panel of three effects, How it works (Design, Preview, Export with videos and the install command), Why it's useful (four media tiles), gallery preview with a button, final CTA, footer. The primary action everywhere is "Open Playground"; the secondary is "Browse gallery".

## Iconography

No icon set is chosen yet. When one is, use single-ink line icons at 24 px, inline SVG so they take `currentColor`, with a text label beside any icon that carries meaning. Buttons and badges use inline 16 to 24 px line glyphs (plus, chevrons, minus circle, spinner, check circle, triangle alert, x circle). The logo lives in `assets/Logo/`.

## Footer

Author name placeholder linking to the GitHub profile, navigation links (Playground, Gallery, GitHub), and the license line "MIT License". MIT is a permissive open-source license: anyone may use, change, distribute and sell the software, including in commercial projects, as long as the copyright and license notice are kept.

## Tokens

Every value below comes from `packages/ui/src/tokens.ts`. Colors have a dark and a light value.

### Color

| Token                   | Dark        | Light       | Usage                                                                                                                                                          |
| ----------------------- | ----------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--veilo-bg`            | `#030303`   | `#F1F1F1`   | Page background, the 60% of the 60:30:10 balance. Ground for text, text-muted, accent and on-accent.                                                           |
| `--veilo-card`          | `#0D0D0D`   | `#E7E7E7`   | Panels, the hero demo, video frames and gallery tiles (the 30%). Always sits on bg; add a border hairline in dark, where the step from bg is small.            |
| `--veilo-secondary`     | `#171717`   | `#DCDCDC`   | Secondary buttons, chips at rest, code blocks, badges. Sits on bg or card. Text on it is text or text-muted.                                                   |
| `--veilo-border`        | `#2A2A2A`   | `#C9C9C9`   | Decorative hairlines around cards, nav and dividers. Not for control outlines (too faint); use border-strong for those.                                        |
| `--veilo-border-strong` | `#6B6B6B`   | `#767676`   | Outlines of controls (secondary button, chip, input) and the slider track. At least 3:1 on bg, card and secondary in both themes.                              |
| `--veilo-text`          | `#EEEEEE`   | `#141414`   | Headings and body copy on bg, card and secondary. Never pure white or pure black.                                                                              |
| `--veilo-text-muted`    | `#A0A0A0`   | `#595959`   | Captions, helper text and labels on bg, card and secondary (at least 4.9:1 in both themes; a test enforces it).                                                |
| `--veilo-accent`        | `#F1F1F1`   | `#030303`   | The one accent, a monochrome inverse of bg (the 10%). Primary button fill, chosen chip fill, focus ring, logo dots. Keep solid fills to a few places per page. |
| `--veilo-on-accent`     | `#030303`   | `#F1F1F1`   | Text and icons on an accent fill.                                                                                                                              |
| `--veilo-base`          | `#171717`   | `#DCDCDC`   | Resting color of skeleton placeholders. The same custom property `@veilo/core` and `@veilo/css` read.                                                          |
| `--veilo-hi`            | `#262626`   | `#F7F7F7`   | Highlight band of the skeleton shimmer. The same custom property the packages read. Raise it slightly if the sweep looks faint.                                |
| `--veilo-grid-dot`      | `#3A3A3A`   | `#B8B8B8`   | Dots of the decorative dot grid. Decorative only; never carries text.                                                                                          |
| `--veilo-danger`        | `#E5857F`   | `#B3261E`   | Error text and icon on bg, card and secondary (at least 4.8:1). Always paired with an icon and a word such as 'Error'; never color alone.                      |
| `--veilo-success`       | `#7FC8A0`   | `#1F6B45`   | Success text and icon on bg, card and secondary. Always paired with an icon and a word such as 'Copied'; never color alone.                                    |
| `--veilo-info`          | `#93A3F5`   | `#3B4BBF`   | Processing status text and icon on bg, card, secondary and info-soft. Always with an icon or dot and a word such as 'Processing'.                              |
| `--veilo-warning`       | `#E6B450`   | `#8A5A00`   | Warning status text and icon on bg, card, secondary and warning-soft. Always with an icon or dot and a word such as 'Warning'.                                 |
| `--veilo-info-soft`     | `#93A3F524` | `#3B4BBF1A` | Soft fill behind an info badge. Pair with info text.                                                                                                           |
| `--veilo-success-soft`  | `#7FC8A024` | `#1F6B451A` | Soft fill behind a success badge. Pair with success text.                                                                                                      |
| `--veilo-warning-soft`  | `#E6B45024` | `#8A5A001A` | Soft fill behind a warning badge. Pair with warning text.                                                                                                      |
| `--veilo-danger-soft`   | `#E5857F24` | `#B3261E1A` | Soft fill behind an error badge. Pair with danger text.                                                                                                        |

### Type

- **Sans:** `"Geist", system-ui, -apple-system, "Segoe UI", sans-serif`
- **Mono:** `"IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace`

| Style       | Group   | Family | Size / line height | Weight | Letter spacing | Usage                                                                |
| ----------- | ------- | ------ | ------------------ | ------ | -------------- | -------------------------------------------------------------------- |
| `h1`        | Display | sans   | 56px / 60px        | 700    | -0.02em        | Hero headline, one per page.                                         |
| `h1-mobile` | Display | sans   | 40px / 46px        | 700    | -0.02em        | `h1` on the 375 px layout.                                           |
| `h2`        | Display | sans   | 40px / 46px        | 700    | -0.015em       | Section titles such as 'Why it's useful.'                            |
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
| `size-grid-dot`                | `1.5px`                  | Dots of the dot grid.                               |

### Radius

| Token         | Value                      | Usage                                                                                                                                                                                                                                               |
| ------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `radius-base` | `8px`                      | The one base radius. Every element that holds no other element: buttons, chips, badges, inputs, tabs, pagination controls, the active nav link, skeletons, and media inside a card or panel. Change it first, then recompute the three steps below. |
| `radius-md`   | `16px`                     | radius-base + space-1 (8 px). Surfaces whose content sits 8 px inside: the tab bar, the segmented bar, the pagination bar, the code block (copy button 8 px from the corner) and a standalone video frame.                                          |
| `radius-lg`   | `24px`                     | radius-base + space-2 (16 px). Cards, which have 16 px padding.                                                                                                                                                                                     |
| `radius-xl`   | `40px`                     | radius-base + space-4 (32 px). Panels such as the hero demo and the playground stage, which have 32 px padding.                                                                                                                                     |
| `radius-pill` | `999px`                    | Round dots and avatars only.                                                                                                                                                                                                                        |
| `radius`      | `var(--veilo-radius-base)` | Read by `@veilo/css` skeletons, so they follow radius-base.                                                                                                                                                                                         |

### Shadow

| Token         | Value                             | Usage                                                                                                                                                                                                                      |
| ------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shadow-soft` | `0 4px 64px 0 rgba(0, 0, 0, 0.1)` | Soft elevation (x 0, y 4, blur 64, 10% black) for raised bars such as tabs, segmented bars and pagination, popovers and the hero demo. Not for every card. In dark mode it is barely visible, so keep the border hairline. |

### Duration

| Token           | Value   | Usage                                                                                                                                                          |
| --------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `duration-fast` | `150ms` | Hover, press, focus and toggle changes on buttons, chips, tabs and links. Pair with ease-out.                                                                  |
| `duration-base` | `250ms` | Tab and panel switches, and popovers, tooltips and dropdowns appearing, leaving or moving. Pair with ease-out to enter, ease-in to leave, ease-in-out to move. |
| `duration-slow` | `400ms` | Large surfaces such as the mobile menu or a dialog. Use sparingly.                                                                                             |

### Easing

| Token         | Value                          | Usage                                                                       |
| ------------- | ------------------------------ | --------------------------------------------------------------------------- |
| `ease-out`    | `cubic-bezier(0, 0, 0.2, 1)`   | Entering and state changes: fast start, soft landing. The default curve.    |
| `ease-in`     | `cubic-bezier(0.4, 0, 1, 1)`   | Leaving: slow start, quick exit.                                            |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Moving between two places on the page, such as a selected-tab fill sliding. |

### Grid

| Token                  | Value    | Usage                                                                       |
| ---------------------- | -------- | --------------------------------------------------------------------------- |
| `grid-desktop-width`   | `1440px` | Website desktop frame width (frame 1440 x 1024); never fluid.               |
| `grid-desktop-columns` | `12`     | Desktop column count, stretch. Each column is about 81.7 px.                |
| `grid-desktop-gutter`  | `20px`   | Desktop gutter between columns. Row gaps use the spacing scale.             |
| `grid-desktop-margin`  | `120px`  | Desktop side margin, also the nav's side padding. Content width is 1200 px. |
| `grid-mobile-width`    | `375px`  | Website mobile frame width (frame 375 x 812); never fluid.                  |
| `grid-mobile-columns`  | `4`      | Mobile column count, stretch. Each column is about 77.8 px.                 |
| `grid-mobile-gutter`   | `8px`    | Mobile gutter between columns.                                              |
| `grid-mobile-margin`   | `20px`   | Mobile side margin, also the nav's side padding. Content width is 335 px.   |

## Components

Components marked _(planned)_ are specified here but not built yet in `packages/ui`.

### Nav _(planned)_

Nav is the top header: logo and wordmark with a version badge, the three page links, GitHub, and the theme switch.

Provide the current page via `aria-current="page"` on one link. Pages are Home, Playground and Gallery. The header is `space-8` (64 px) high with the grid margin as side padding (120 px on desktop, 20 px on mobile; in the playground, the playground's gutter) and a `border` hairline below.

- The active link is an inverted `accent` fill with `on-accent` text; other links are plain `text` with a `secondary` hover fill.
- The wordmark is set lowercase, `veilo`, in the nav only; the mark beside it is the dotted ghost logo. Until the logo SVG is added to `assets/Logo/`, show a plain `accent` square.
- The theme switch is a small segmented bar (System, Light, Dark; see Chip). It follows the system theme by default and stores the user's choice. Until the Nav exists, the playground shows it in its header.
- On the 375 px mobile layout show the logo and a menu button only; move the page links, GitHub and the theme switch into the menu.

### Button

Button is the action control, in primary, secondary and ghost variants and three sizes (`Button` in `@veilo/ui`).

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
- **Chip group** (`ChipGroup` with `ChipGroupItem`): a single choice. It is a `radiogroup` with `radio` items and an `aria-label`; exactly one item is chosen, arrow keys move between items, Space or Enter chooses, and pressing the chosen item keeps it chosen. Items wrap with `space-1` gaps.
- **Segmented bar** (`ChipGroup variant="segmented"`): the same chip group inside a raised bar that looks like the tab bar: `card` fill, `border` hairline, `radius-md`, `space-1` padding, `shadow-soft`. Chips inside are transparent and `text-muted` at rest, `text` on hover, and the chosen one gets a `secondary` fill, `border` hairline and `text`. Use it for small settings that sit apart from the main controls, such as the theme switch; a test keeps it identical to the tab bar.

Rules:

- In the default group, the chosen chip is an inverted `accent` fill with `on-accent` text, not only a color change, so the state reads without color. Rest is a `secondary` fill with a `border-strong` outline; hover turns the outline `accent`.
- Keep chip labels to one or two words; in the hero demo show exactly three presets.
- Do not use a chip as a navigation link; use the nav link or a button.

### Tabs

Tabs is a segmented bar for switching between views of the same content (the playground's Loader, Reveal and Export sections, for example), built on Radix Tabs.

Provide the tab list with an `aria-label`, one trigger per view and the matching content panels. Radix handles `role="tablist"`, `aria-selected`, arrow keys, Home and End.

- The bar is a `card` with a `border` hairline, `radius-md` and `shadow-soft`. Tabs are `size-tab` (40 px) high with `radius-base`, so the bar is 8 + 8 padding = 16.
- The selected tab has a `secondary` fill, `text` color and a `border` hairline; unselected tabs are `text-muted` and become `text` on hover. State never rests on color alone: the fill marks the selected tab.
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

### Badge _(planned)_

Badge is a small label for versions and status. Status badges use a soft or outlined style and a dot or an icon.

Provide a one to three word label. Status badges take a tone: default, info (Processing), success, warning, danger (Error), in a soft or outlined style, with a dot or a 16 px icon before the label.

- The compact badge is `size-badge` (24 px) high, `radius-base`, `space-1` side padding, in `label-sm`: for version numbers, "Coming soon" and section eyebrows such as "How it works". A solid (`accent`) badge marks one highlighted item at most.
- Status badges are `size-control-sm` (32 px) high with `space-1-5` side padding, in `label-sm`.
- Always show the word and a dot or icon; color alone never carries the status. Use the icon version when the status must be told apart at a glance (Default minus, Processing spinner, Success check, Warning triangle, Error x).
- Soft style (tinted `*-soft` fill, toned text) for tables and lists; outlined style (`border` hairline, `text` label, toned icon or dot with a soft halo) on busy surfaces.
- Use "Coming soon" instead of caveats in public copy. A badge is not interactive; use a chip for filters.

### Card _(planned)_

Card is a flat container on `card` with a hairline border, in a standard size and a large panel size.

Provide the content as children. Use the standard card (`radius-lg`, `space-2` padding) for features, tiles and the playground's transport bar and control panel, and the panel (`radius-xl`, `space-4` padding) for the hero demo and the playground stage.

- Cards are always lighter or darker than `bg` by fill; in dark mode the step is small, so keep the `border` hairline.
- Flat by default; add `shadow-soft` only for floating or raised panels. No colored left borders. Do not nest a card inside a card; use `secondary` fills for inner groups.
- Corners follow outer = inner + padding: 8 + 16 = 24 for a card, 8 + 32 = 40 for a panel. Media inside either one uses `radius-base` (outer minus padding).
- A card that waits for content shows a skeleton from `@veilo/css` in the shape of the real content and keeps its final size.

### CodeBlock

CodeBlock shows one command or snippet in monospace with a copy button (`CodeBlock` in `@veilo/ui`).

Provide the text. Add the `$` prompt only for shell commands. The Copy button copies the text and shows "Copied" for about 1.6 seconds; if the clipboard is blocked it shows "Press Ctrl+C" and selects the text.

- Fill is `secondary` with a `border` hairline and `radius-md`, because the copy button sits 8 px inside the corner (8 + 8 = 16); type is `code` in `text`, the prompt in `text-muted`.
- Long lines scroll horizontally inside the block; never wrap a command. Inside a grid the block keeps `min-width: 0`, so it never widens its cell.
- The success label uses `success` together with the word "Copied", never color alone.

### TextArea and ColorField

TextArea is a multi-line input in `code` type with a `border-strong` outline and `radius-base`, for pasting JSON. ColorField is a `size-control-sm` color swatch plus a `#rrggbb` text box; an invalid value shows a message and is restored on blur.

### Tooltip

Tooltip (Radix Tooltip, inside one `TooltipProvider`) explains an icon-only control in `caption`. It appears with `duration-base` and `ease-out`. Never put information only in a tooltip.

### VideoFrame _(planned)_

VideoFrame is the rounded frame for looping demo videos and gallery tiles, 16:9 or square.

Provide a `<video>` (muted, loop, playsinline, with a `poster`) or an `<img>`, and an optional `<figcaption>`. Videos autoplay only when the viewer has not asked for reduced motion; otherwise they show the poster.

- The frame is `card` with a `border` hairline and `radius-md`; inside a card or panel it uses `radius-base` instead (outer radius minus padding). It always reserves its aspect ratio, so the page never shifts when the video loads.
- While loading, fill the frame with a skeleton from `@veilo/css` (the same shimmer the package ships).
- Captions are `caption` in `text-muted`, centered when the frame is centered under a step title.
- Do not add play overlays or shadows. Every video has an accessible text equivalent in the nearby heading and caption.

### Skeleton

Skeletons on the site and in the playground come from `@veilo/css` (classes `veilo`, `veilo-shimmer`, `veilo-wave`, `veilo-pulse`, or CSS from its generator). They read `--veilo-base`, `--veilo-hi` and `--veilo-radius` from the tokens, stop under reduced motion, and are never hand-written.

### Motion

Motion is the set of three durations and three easing curves that every interface transition in Veilo uses.

Provide the properties that change and take the timing from tokens, for example `transition: background-color var(--veilo-duration-fast) var(--veilo-ease-out)`. Never write a time or a curve by hand; a test fails on hand-written times, curves, colors and lengths in component styles.

- Animate only `opacity`, `color`, `border-color`, `background-color` and `transform`. Never animate width, height, top or left, so content stays put.
- Use `ease-out` to enter or change state, `ease-in` to leave and `ease-in-out` to move between two places.
- Under `prefers-reduced-motion` the three durations drop to 0 ms, so transitions become instant. The skeleton sweep stops and videos show their poster.
- The loader sweep and the reveals are product motion. Their speed and curve are settings in the playground and are not these tokens.

## Assets

### Logo

The Veilo logo is a small, rounded dotted ghost (dot grid, no text) whose right side dissolves into dots. It is a separate mark from the wordmark.

Add the logo as a single-ink SVG on a transparent background, 512x512. Because SVGs shown through `<img>` cannot inherit color, add one file in `accent` ink for each theme (for example `ghost-dark-theme.svg` in #F1F1F1 and `ghost-light-theme.svg` in #030303). Until then the nav shows a plain `accent` square as a stand-in; never redraw the ghost in code.

## Code

- Tokens: `packages/ui/src/tokens.ts` (edit) and `packages/ui/tokens.css` (generated; import `@veilo/ui/tokens.css` once per app).
- Components: `packages/ui/src/components/`, exported from `@veilo/ui`. Preview them with `pnpm --filter @veilo/ui dev`.
- Skeletons: `@veilo/css`.
