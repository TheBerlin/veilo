# Skeleton builder: design

Status: approved design for milestone M10 (build in 0.9.0). Written in M7 (0.6.0); nothing in this document is built yet. Where this file and the code differ, the code wins until M10 starts, then this file is updated.

The builder lets someone build a skeleton for their own component without writing markup: they arrange text, image and button placeholders in a constrained layout, watch the real Veilo skeleton and reveal run on it, and export markup, CSS and the layout JSON.

## Where it lives

A **Build** mode in the playground, beside the existing test card (a Test card | Build switch in the header). The builder replaces the test card on the stage. The settings panel keeps its tabs, so every effect works on a built skeleton exactly as it does on the test card. In Build mode the **Content** tab is replaced by a **Layers** tab (the document replaces the card's text, layout and width), and the Export tab also writes the builder's output. The five card layouts of the Content tab become the builder's starting templates.

The canvas is the editor (see Editing): there is no permanent outline column and no permanent properties column. The design was revised after a usability review, which found that the first version sent every edit through two side panels.

## Data model

The builder's document is stored **beside** the layout JSON, not inside it. Core never reads it: core still takes `{ version, settings, slots }`, and the slots are derived from the document. The 1.0 settings schema freeze is not affected.

```ts
interface BuilderDoc {
  version: 1;
  /** The card's outer width in CSS px, 200 to 720 in steps of 10 (as Card width today). */
  width: number;
  root: FrameNode;
}

type BuilderNode = FrameNode | TextNode | ImageNode | ButtonNode;

interface NodeBase {
  /** Stable id inside the document (`n1`, `n2`, ...). Never shown. */
  id: string;
  /** How the element's width is set inside its parent. */
  size: "hug" | "fill" | number; // number: a fixed width in px, a multiple of 8, 16 to 720
}

interface FrameNode extends NodeBase {
  type: "frame";
  direction: "column" | "row";
  /** Space between children and padding inside, as space-token steps. */
  gap: SpaceStep;
  padding: SpaceStep;
  /** Alignment along the direction. */
  main: "start" | "center" | "end" | "between";
  /** Alignment across the direction. */
  cross: "start" | "center" | "end" | "stretch";
  /** `card` draws the card surface (background, border, radius); `none` draws nothing. */
  surface: "none" | "card";
  children: BuilderNode[];
}

interface TextNode extends NodeBase {
  type: "text";
  slot: string; // the data-veilo-slot name, unique in the document
  style: "heading" | "body" | "caption"; // type tokens label, body, caption
  lines: number; // placeholder lines while the text is empty, 1 to 5
  last: number; // width of the last line in percent, 10 to 100 in steps of 10
  text: string; // the sample text shown when revealed, at most 120 characters
}

interface ImageNode extends NodeBase {
  type: "image";
  slot: string;
  ratio: AspectRatioId; // the playground's list: 1:1, 4:3, 3:2, 16:9, 3:4, 2:3
  shape: "square" | "rounded" | "round"; // 0, radius-base, radius-pill
}

interface ButtonNode extends NodeBase {
  type: "button";
  slot: string; // the button; its label slot is `${slot}-label`
  label: string; // at most 40 characters
}

type SpaceStep = "0" | "0.5" | "1" | "1.5" | "2" | "2.5" | "3" | "4"; // the space tokens
```

**Derived layout JSON.** Each leaf gives one slot: an image gives `{ role: "image" }`, a text gives `{ role: "text", lines, width: last }`, a button gives `{ role: "button" }` and a text slot `${slot}-label`. The result is the same `{ version: 1, settings, slots }` the Export tab already writes.

**Limits** (so share links stay short and the editor stays fast): at most 30 elements, 4 levels of frames, 120 characters per text. Loading a saved or shared document validates every field, drops what is wrong and never throws, as the content store does today.

**Storage.** `builder?: BuilderDoc` is added to the last session and to the share link payload, next to `content`. A link without it opens the test card. Builder documents are not part of My presets (as the card content is not), but a document can be exported and imported as JSON.

## The constrained layout

Modeled on Figma auto-layout and components. There is **no free positioning**: no x and y, no overlap, no absolute elements. A document is a tree of frames; everything is placed by direction, gap, padding, alignment and sizing. Because of that:

- every spacing value is a design token step, so builds look like the rest of Veilo;
- the export is plain flexbox, which is readable and survives any framework;
- the skeleton always matches the real component, because it is the real DOM.

**Sizing.** A child is `hug` (as wide as its content), `fill` (shares the free space of the parent) or a fixed width. An image with `fill` keeps its ratio. A text with `fill` wraps. In a column, `fill` means the full width; in a row, the free space is shared by the `fill` children.

**Alignment.** `main` and `cross` are the alignment anchors: where children sit along the direction and across it. `between` spreads children with the free space between them (a price at the left and a button at the right).

**In the editor** the model is shown with fewer choices than it stores. Gap and padding appear as four chips, None, S, M and L (0, 8, 16 and 24 px); the other space steps are under More. Alignment along the direction is four icon buttons (start, center, end, space between) and cross alignment and the card surface are under More. Width is three buttons (Hug, Fill, Fixed) and the number field appears only for Fixed. A one-line sentence under the controls says what they do ("Items sit in a row, 8 px apart, spread to both ends").

**Surface.** Only a frame can be a card surface (padding, 1 px border, radius `radius-lg` for the root and `radius-md` inside, as the design system's radius rule says). The root frame is a card by default.

## The elements

| Element | Properties                                                                                  | Placeholder while loading                            |
| ------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Frame   | direction, gap, padding, main, cross, surface, size                                         | none: it only arranges its children                  |
| Text    | style (heading, body, caption), lines 1 to 5, last line width, sample text, slot name, size | one rounded bar per line, the last at `last` percent |
| Image   | ratio, shape, slot name, size                                                               | one solid block, round for `round`                   |
| Button  | label, slot name, size                                                                      | a solid block with the label as its own text slot    |

The text style also chooses the exported tag: **heading** exports as `<h2>`, **body** and **caption** as `<p>` (caption with a `caption` class for the muted size). The slot name is an internal name shown under More ("Name"); it is generated from the element (`heading`, `line1`, ...) and must be unique, with an inline error when it is not. Lines is a row of five choices, 1 to 5.

No other elements in 0.9.0: no dividers, icons, spacers (use gap and alignment), videos or inputs.

## Templates

The five card layouts of the Content tab become trees. A template list opens as a popover under the **Template** select in the header, not as a dialog. Choosing one replaces the document at once and a toast offers **Undo** (Ctrl+Z works too), which is faster than a confirmation step and just as safe. The select reads "Template: Product card (edited)" once the document differs from its template. A new Build session opens on the product template, already animating, so the first minute shows the engine working.

| Template       | Tree                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Product card   | column card: image (fill, 1:1), heading, body, body, row (price, old price), button (fill)                     |
| List row       | row card, cross center: image (64 px square), column (heading, body), price                                    |
| Profile header | column card: row (round image 72 px, column (heading, caption)), body, button (fill)                           |
| Article teaser | column card: image (fill, 16:9), caption, heading, body, body, caption                                         |
| Table row      | row card, cross center, main between: image (40 px square), column (heading, caption), caption, caption, price |

Text, widths and ratios start from the playground's present defaults, so a template looks like the card the user already knows.

## Editing

The canvas is the editor. A button or text is edited where it is, not in a form somewhere else.

- **Select and edit.** Click an element on the canvas to select it: a 2 px selection outline appears, and a breadcrumb in the stage bar shows where it is ("Card › Prices › price"; clicking a crumb selects that frame). Double-click a text or button to type its sample text in place.
- **Floating toolbar.** Above the selection: Duplicate, Move up, Move down, Wrap in frame and Delete, as icon buttons with tooltips that show the shortcut. Delete removes at once, with its children, and a toast offers Undo.
- **Adding.** A "+" mark appears between elements on hover, on focus and while a frame is selected; it is the only way to add. It opens a small menu of the four elements, each with a one-line description. An empty frame shows a "+" inside it.
- **Properties popover.** Anchored beside the selection and kept small: it shows only the selected element's few settings, grouped, at most four choices per group (see Elements and The constrained layout). Less common settings, such as the slot name, sit under **More**. Escape closes it and keeps the selection.
- **Layers tab.** The tree as a list in the panel, as `role="tree"`: select, rename, drag handles to reorder and move between frames. It replaces the old permanent outline column, so the canvas gets the room.
- **History.** Undo and redo of document changes, 50 steps, as icon buttons in the stage bar and with Ctrl+Z and Ctrl+Shift+Z. An element counter ("9 of 30") sits beside them.
- **Preview.** Play, Loading and Revealed are in the transport bar, and the active state is filled. While a preview plays the selection marks are hidden; clicking the card stops it and selects what was clicked.
- **Small screens** (375 px layout): the canvas on top and a dock of four 44 px targets: **Layers**, **Edit**, **Effects** and **Export**. Each opens a bottom sheet at half height, so the selected element stays visible above it and the canvas scrolls to keep it clear. The Template select sits at the top of the Layers sheet. The floating toolbar's buttons are 44 px there.

## Limits, mistakes and states

- **Empty document.** A dashed area with "Start from a template" (primary) and "Add a frame". A new document opens on the product template, so this shows only after everything is deleted.
- **Element limit (30).** The counter turns solid at 30 of 30, every choice in the Add menu is disabled, and a line says "Delete an element to add another."
- **Depth limit (4 levels).** Only Frame is disabled in the Add menu, with the reason written on it ("Frames nest 4 levels deep").
- **Delete a frame with children.** No confirmation: it deletes at once and a toast says "Deleted Prices and 2 items" with Undo.
- **Text and names.** Fields stop at their limit (120 characters for text, 40 for a button label) and show a counter ("118 / 120"). A duplicate slot name shows "Name already used. Each name must be unique." under the field and is not saved.
- **Loading a saved or shared document** that is invalid drops what is wrong and opens what remains, with a note ("Some parts of this document were not valid and were left out").

## Keyboard and accessibility

Every control is a real `button`, `input` or `select` with a visible focus ring. Tab order: header, the stage bar, the canvas (arrow keys move the selection between elements, Enter edits the text, Escape deselects), the properties popover, then the panel. Shortcuts: Ctrl+D duplicate, Delete delete, Ctrl+Z and Ctrl+Shift+Z undo and redo, Ctrl+Shift+Up and Down reorder (not Alt+arrows, which browsers and the OS use). All touch targets are at least 44 px on the 375 px layout. The selection color is a design token (`--veilo-selection`, with an `on` color for text on it) that meets 3:1 against the page and 4.5:1 for its label in both themes. Preview state is announced in a polite live region, as the playground's transport already does.

## Export and sharing

The Export tab's Code section gains the builder's output, built by the same snippet builders as today:

- **HTML and CSS**: the markup with `data-veilo-slot` and the flex CSS the tree implies (`display: flex; flex-direction; gap; padding; justify-content; align-items; width`), in px values resolved from the tokens, classes named from the slots.
- **React, web component and CDN**: the same markup and CSS, in the snippet shapes of M7.
- **Layout JSON** and **Builder JSON** (the document, for import).
- The share link carries the document.

The snippet check of M7 (`examples/snippet-check`) is extended to build and run the builder's output for every template.

## Out of scope for 0.9.0

Free positioning, wrapping grids, custom colors and fonts, uploaded images (the placeholder photo only), component variants, nested reusable components, multi-select, and a timeline editor.

## Build plan (milestone M10)

1. Data model: types, validation, limits, slot derivation, templates (pure, tested in Node).
2. Canvas and elements: render a document as DOM, selection overlay, core running on it.
3. Constrained layout and properties: the properties panel for each element, sizing and alignment.
4. Direct editing: selection, floating toolbar, "+" marks, in-place text, properties popover, Layers tab, history, keyboard, states and limits, small-screen sheets.
5. Export and sharing: HTML and CSS, snippets, builder JSON, share link, snippet check.
6. Release v0.9.0.

## Decisions to revisit

- Whether `builder` joins the public layout JSON at the 1.0 schema freeze review (M9). It stays separate until then.
- The element limits (30 elements, 4 levels) after real use.
- Whether the Layers tab is needed at all once direct editing is in use, or a breadcrumb is enough.
- Whether Build should stay a separate mode or the test card should become editable (the review raised it; the design keeps Build).
- Whether templates can be saved by the user (as My presets are) after the first release.
