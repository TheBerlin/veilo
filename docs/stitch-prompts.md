# Veilo: prompts for Stitch

How to use: paste **Part A** first, as the brief for the project. Then paste one screen prompt from **Part B** at a time, desktop first, then its mobile version. After each screen, check it against the checklist in Part C before moving on. Short follow-up edits ("make the gap above the title 16 px") work better than regenerating.

---

## Part A. Shared brief (paste first)

You are designing the website and web app for **Veilo**, a free, open-source tool and set of npm packages for **skeleton loaders** (placeholder shapes that shimmer while content loads) and **reveal animations** (an image appears through dots, hex characters, binary digits or mosaic tiles; text decodes from scrambled characters). Users design an effect visually in the Playground, then copy CSS or JSON, or install a package for React, Vue, Svelte, Angular or plain HTML.

**Pages:** Home (landing), Playground (the tool), Gallery (all ready-made effects), plus a 404 page. Every page has the same top Nav and Footer.

**Style:** tech, calm, black-dominant, monochrome. No gradients, no blur, no illustrations or stock photos, no emoji, no colored accents. The only decoration is a **dot grid** (1.5 px dots on a 16 px pitch, color `grid-dot`), used only in the Home hero, the final call to action and the Playground stage. Hierarchy comes from fill, shape and size, never from color. Exactly one solid accent-filled primary button per view.

**Themes:** design dark first, then light. Use only these colors.

| Token              | Dark              | Light             | Use                                                                    |
| ------------------ | ----------------- | ----------------- | ---------------------------------------------------------------------- |
| bg                 | #030303           | #F1F1F1           | Page background (about 60% of the screen)                              |
| card               | #0D0D0D           | #E7E7E7           | Panels, demo, video frames, gallery tiles (about 30%)                  |
| secondary          | #171717           | #DCDCDC           | Secondary buttons, chips at rest, code blocks, badges                  |
| border             | #2A2A2A           | #C9C9C9           | 1 px hairlines around cards, nav, dividers                             |
| border-strong      | #6B6B6B           | #767676           | Outlines of controls, slider tracks                                    |
| text               | #EEEEEE           | #141414           | Headings and body                                                      |
| text-muted         | #A0A0A0           | #595959           | Captions, helper text, labels                                          |
| accent             | #F1F1F1           | #030303           | Primary button fill, chosen chip, current page, focus ring (about 10%) |
| on-accent          | #030303           | #F1F1F1           | Text on an accent fill                                                 |
| skeleton base      | #171717           | #DCDCDC           | Resting skeleton placeholder                                           |
| skeleton highlight | #262626           | #F7F7F7           | Shimmer band                                                           |
| grid-dot           | #3A3A3A           | #B8B8B8           | Dot grid only                                                          |
| success / danger   | #7FC8A0 / #E5857F | #1F6B45 / #B3261E | Only with an icon and a word ("Copied", "Error")                       |

**Type:** Geist for everything, IBM Plex Mono for code and for scrambled characters.

| Style    | Size / line         | Weight          | Tracking |
| -------- | ------------------- | --------------- | -------- |
| h1       | 56 / 60 (mobile 40) | 700             | -0.02em  |
| h2       | 40 / 46 (mobile 32) | 700             | -0.015em |
| h3       | 28 / 34             | 700             | -0.01em  |
| body-lg  | 20 / 30             | 400             |          |
| body     | 16 / 24             | 400             |          |
| label    | 16 / 24             | 500             |          |
| label-sm | 14 / 20             | 500             |          |
| caption  | 14 / 20             | 400, text-muted |          |
| code     | 14 / 22 mono        | 400             |          |

**Spacing:** 8-point scale only: 8, 16, 32, 64, 128 (and 4, 12, 20, 24 inside buttons and badges). Sections are 64 apart. Inside a section, title, text and media are 8 apart, with 16 above a title that follows a small label.

**Radius rule:** outer radius = inner radius + padding. Every element that holds nothing else (button, chip, input, tab, badge, skeleton, media inside a card) is **8**. Tab bar, segmented bar, pagination bar, code block, standalone video frame are **16** (8 padding). Cards are **24** (16 padding). Large panels (hero demo, Playground stage) are **40** (32 padding). Never nest a card inside a card. Fully round only for dots, avatars and slider thumbs.

**Elevation:** one shadow only, `0 4px 64px rgba(0,0,0,0.10)`, for raised bars (tab bar, segmented bar, pagination), popovers and the hero demo. Keep the 1 px border hairline everywhere in dark mode.

**Layout grid:** desktop frame exactly 1440 wide: 12 columns, 120 px side margins, 20 px gutters (content 1200 px). Mobile frame 375 wide: 4 columns, 20 px side margins, 8 px gutters (content 335 px). Place every block on whole columns.

**Components (use only these):**

- **Nav:** 64 px high, border hairline below, side padding = grid margin. Left: logo (a 24 px rounded square in accent as a stand-in) + lowercase wordmark "veilo" + version badge "v0.3". Middle: links Home, Playground, Gallery; the current page is an accent-filled pill (radius 8) with on-accent text, the others plain text with a secondary hover fill. Right: GitHub link with icon, and a theme switch (System / Light / Dark as a small segmented bar). Mobile: logo + wordmark + menu button only; the links, GitHub and theme switch move into the menu.
- **Button:** heights 32 / 44 / 52, radius 8. Primary = accent fill. Secondary = secondary fill with border-strong outline. Ghost = no fill, no outline. Icon-only buttons are squares.
- **Chip:** 36 high, radius 8, secondary fill with border-strong outline; chosen = accent fill with on-accent text. Chip groups wrap with 8 gaps.
- **Segmented bar:** the chips sit inside a raised bar (card fill, border hairline, radius 16, 8 padding, soft shadow); chips inside are transparent and muted, the chosen one gets a secondary fill and border. Same look as Tabs.
- **Tabs:** same raised bar; tabs 40 high.
- **Slider:** label above, value at the right of the label, thin 4 px track in border-strong, filled part and 16 px round thumb in accent, end values in caption below.
- **Select:** native select, 32 high, border-strong outline, radius 8.
- **Toggle switch:** for on/off such as Loop.
- **Code block:** secondary fill, border hairline, radius 16, mono text, a small "Copy" button 8 px inside the right edge. A `$` prompt in text-muted for shell commands. Never wraps; scrolls sideways.
- **Badge:** 24 high, radius 8, small label, used for versions, "Coming soon" and the "How it works" eyebrow.
- **Card:** card fill, border hairline, radius 24, 16 padding. **Panel:** radius 40, 32 padding.
- **Video frame:** card fill, hairline, radius 16 (8 inside a card), fixed aspect ratio 16:9 or 1:1, shows a still poster frame of the effect.
- **Skeleton:** rounded 8 bars in skeleton base color with a lighter diagonal highlight band.

**Voice:** direct and calm, sentence case, no exclamation marks, no hype words. Step titles end with a period ("Design."). Primary action everywhere: "Open Playground". Secondary: "Browse gallery".

**Accessibility:** text contrast at least 4.5:1; every interactive element has a visible 2 px accent focus outline with 2 px offset; status never by color alone.

**The demo card** (used in the Home demo and the Playground): a 320 px wide product card (card fill, radius 24, 16 padding) with a square image on top (radius 8), heading "MCHOSE L7 Pro", two description lines "Lightweight 8K polling mouse with" / "tri-mode wireless and a 60 g shell.", price "$59.99" and struck-through "$79.99", and a full-width 42 px "Buy now" button. Show it in one of three states depending on the screen: **loading** (every part replaced by skeleton bars of the same size; text bars thinner than the line, last line shorter), **revealing** (the image made of round dots of varying size in text color on the light photo, text partly replaced by scrambled characters such as `●•∙·` or `A3F-_`), or **revealed** (real content).

---

## Part B. Screen prompts (one at a time)

### B1. Home, desktop 1440

Design the **Home** page at 1440 wide, dark theme, using the brief. Sections from top to bottom, each 64 px apart unless stated:

1. **Nav** (Home is current).
2. **Hero** on the dot grid background, 128 px from the nav to the headline. Left 6 columns: h1 "Design skeleton loaders and reveal animations, visually." Below it (32 px) body-lg in text-muted: "Tune every effect with live controls, preview it on your own image and text, and export CSS or JSON that works in React, Vue, Svelte, Angular or plain HTML." Below (32 px) a primary button "Open Playground" and, 16 px to its right, a secondary button "Browse gallery". Below the buttons (16 px), a one-line code block `$ npm install @veilo/core`. Right 6 columns: a large ghost mark made of dots (rounded ghost shape whose right side dissolves into scattered dots), accent colored, vertically centered with the text.
3. **Demo panel** (panel: card fill, radius 40, 32 padding, soft shadow), 12 columns. Left 6 columns: the demo card in the **revealing** state (dots image, scrambled heading). Under the card: a row with "Replay" (secondary), "Loading" (secondary) and a "Loop" toggle switch. Right 6 columns: small label "Loader" then three chips "Shimmer", "Wave", "Pulse" (Shimmer chosen) and one slider "Speed" with ends 0.5x and 2x; then 32 px below, label "Reveal" with three chips "Dots", "Hex", "Mosaic" (Dots chosen), a select "Direction" (Left) and a slider "Duration" with ends 0.5x and 2x. At the bottom right, a ghost button "Open in Playground" with an arrow.
4. **How it works.** Centered badge "How it works", then three rows. Each row: text in 4 columns and a 16:9 video frame in 7 columns, one empty column between, alternating sides (text left in rows 1 and 3, right in row 2). Rows are 64 apart. Row text: h3 "Design." + body "Tune loaders and reveals with live controls."; h3 "Preview." + body "See them on your own image and text."; h3 "Export." + body "Copy CSS or JSON, or install a package." + a code block `$ npm install @veilo/react`. Each frame shows a still of the playground or demo card at that step.
5. **Why it's useful.** Centered h2 "Why it's useful." Then four cards, 3 columns each, 8 px from the title row. Each card: a square video frame (radius 8) then 8 px below a bold title and a caption. Titles and captions: "No layout shift." / "Placeholders keep the content's size."; "CSS-only loaders." / "No JavaScript needed to shimmer."; "Any framework." / "React, Vue, Svelte, Angular or HTML."; "Reduced motion." / "Effects calm down when users ask."
6. **Gallery preview.** h2 "Browse the gallery." left-aligned with a secondary button "Browse gallery" on the right of the same row. Below, three gallery tiles of 4 columns each (see Gallery tile in B3).
7. **Final call to action** on the dot grid, centered: h2 "Ready to design your loading state?", 16 px below a primary button "Open Playground".
8. **Footer**, border hairline above, 32 px vertical padding: left "Made by [Author name]" linking to GitHub; middle links Playground, Gallery, GitHub; right "MIT License" in caption.

### B2. Home, mobile 375

Same Home page at 375 wide, dark theme. Nav collapses to logo, wordmark and a menu button. Every block spans 4 columns. Hero: h1 at 40 px, the ghost below the text at about 200 px, buttons stacked full width (primary first). Demo panel: padding 16, radius 24; card on top, controls below. How it works: each step stacks title, text, then the video frame, centered. Why it's useful: 2 by 2 tiles of 2 columns each. Gallery preview: one tile, then the button full width. Footer stacked and centered.

### B3. Gallery, desktop 1440

Design the **Gallery** page, dark theme. Nav with Gallery current. Then:

1. Page header, 64 px below the nav: h2 "Gallery." and a caption "Every ready-made effect. Open one in the Playground to change it."
2. Toolbar, 32 px below: a search input (6 columns, placeholder "Search effects") on the left; on the right a select "Sort: Popular". Below (16 px) three filter rows with a caption label and chips that can be combined: "Loader" Shimmer / Wave / Pulse; "Image" Dots / Hex / Binary / Mosaic / Blur / Wipe / Crossfade / Zoom; "Text" Scramble / Typewriter / Rise / Fade. A ghost button "Clear filters" at the end. Show two chips chosen.
3. Result count in caption: "12 effects".
4. Grid of gallery tiles, 4 columns each, 3 per row, 20 px gutters, 32 px row gap, 3 rows. **Gallery tile** = card (radius 24, 16 padding): a square video frame (radius 8) showing the demo card mid-reveal with that effect, then 16 px below the effect name in label ("Hex from center"), a row of small badges (Shimmer, Hex, Scramble), and a secondary small button "Open in Playground". Use these names: Dot upscale, Hex from center, Matrix columns, Cascade wave, Soft pulse, Compact shimmer, Mosaic from edge, and five more in the same style.
5. Pagination bar centered below the grid: raised bar with previous (secondary icon button), "Page 1 of 3", next (primary icon button).
6. Footer.

Also design two states: an **empty result** (the grid replaced by a centered caption "No effects match these filters." and a secondary button "Clear filters") and a **loading** state (tiles as skeletons of the same size).

### B4. Gallery, mobile 375

Gallery at 375 wide. Search full width; filters collapse behind a secondary button "Filters" that opens a bottom sheet with the three chip rows and "Show 12 effects" primary button. Tiles one per row, 4 columns. Pagination below.

### B5. Playground, desktop 1440

Design the **Playground** app screen, dark theme. This is a tool, so it is denser than Home; keep the same tokens. Nav with Playground current.

1. Header row under the nav (32 px from it): h3 "Playground" and caption "Design skeleton loaders and image and text reveals, then export the settings or the CSS." Below it (16 px) preset chips: Dot upscale (chosen), Hex from center, Matrix columns, Cascade wave, Soft pulse, Compact shimmer, Mosaic from edge.
2. Workspace, 32 px below: left 8 columns, right 4 columns (about 380 px).
   - **Left, sticky while the page scrolls:** the **stage**, a panel (radius 40, 32 padding) with the dot grid, the demo card centered, in the revealing state. Under the stage (16 px), the **transport bar** (card, radius 24, 16 padding): primary "Play sequence", secondary "Loading state", secondary "Replay reveal", a "Loop" toggle; on a second row a full-width scrubber slider (reveal progress 0 to 100%), a readout "0.42 / 1.04 s" in mono caption and a status "Revealing 40%"; at the end of the bar a small image picker: two 32 px thumbnails (sample images), a secondary small button "Use my own image" and a ghost "Reset".
   - **Right:** the control panel (card, radius 24, 16 padding). On top a tab bar: Loader, Reveal, Export (Loader chosen). Under it grouped controls, each group with a caption heading:
     - Effect: chips Shimmer sweep / Wave, staggered / Pulse.
     - Timing: sliders Duration (1.20 s), Pause between passes (0.20 s); select Easing (Ease out); chips Repeat Loop / Once.
     - Shape: sliders Sweep angle (100°), Highlight width (30%), Bar corner radius (6 px).
     - Colors: two color fields "Base" and "Highlight" (a 32 px swatch + hex text input), a ghost "Reset colors".
3. No footer on this screen, or a compact one.

Then design the **Reveal** tab content: Image group (select Image reveal: Dots; chips Origin Left / Right / Top / Bottom / Center / Diagonal / Random; sliders Grid columns 64, Start scale 2.5×, Cell stagger spread 0.6), Text group (chips Scramble / Typewriter / Rise / Fade; chips Characters Dots / Hex / Binary / Symbols; chips Resolve by Character / Word), Timing group (sliders Duration 1.04 s, Loading time 1.2 s; select Easing Ease out, soft).

And the **Export** tab: "Settings (JSON)" code block, 12 lines visible with a Copy button; "Loader CSS" code block with Copy; "Load settings" text area (5 lines, mono) and a secondary button "Apply settings" with a caption "18 settings applied." in text-muted.

And a **custom curve** state on the Loader tab: when Easing is "Custom curve", a 1:1 graph (secondary fill, radius 8) shows the cubic-bezier curve with two draggable round handles, plus four small number fields x1 y1 x2 y2.

### B6. Playground, mobile 375

Playground at 375 wide. One column: header with preset chips scrolling horizontally in one row, then the stage (not sticky, padding 16, radius 24), the transport bar wrapping onto three rows, then the control panel full width with the tab bar. Keep 20 px side margins.

### B7. 404 page

A centered 404 on the dot grid, dark: the ghost mark made of dots at about 160 px, h2 "This page faded out.", caption "The link may be old or mistyped.", primary "Open Playground", secondary "Go home". Nav and footer as usual.

### B8. Light theme pass

Repeat B1, B3 and B5 in the light theme, using the light column of the color table. The accent becomes near black, so the primary button is black with light text. Keep everything else identical.

---

## Part C. Checklist after each screen

- Only the listed colors; no blue links, no gradients, no colored icons.
- One primary (accent) button per view.
- Radii are only 8, 16, 24, 40 and follow outer = inner + padding.
- Spacing values only from 4, 8, 12, 16, 20, 24, 32, 64, 128.
- Desktop content sits inside 120 px margins on the 12-column grid; mobile inside 20 px margins.
- The dot grid appears only in the hero, final CTA, Playground stage and 404.
- Text is never pure white or pure black.
