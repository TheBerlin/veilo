# Veilo logo guidelines

The logo is a ghost drawn on a dot grid. Its right edge starts to dissolve into smaller dots: content being revealed.
It has no text; the logo and the name "Veilo" are separate marks.

## Files

| File                                           | Use                                                                                                                                                                                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `veilo-mark.svg`                               | Master, black on transparent. Edit this one, then re-export.                                                                                                                                                                                           |
| `veilo-mark-white.svg`, `veilo-mark-black.svg` | One-colour versions.                                                                                                                                                                                                                                   |
| `veilo-mark-mono-e2e2e7.svg`                   | Brand colour for dark surfaces (`#E2E2E7`).                                                                                                                                                                                                            |
| `veilo-mark-mono-1e1e22.svg`                   | Brand colour for light surfaces (`#1E1E22`).                                                                                                                                                                                                           |
| `veilo-mark-square.svg`                        | Avatar and social master (padded square).                                                                                                                                                                                                              |
| `veilo-mark-app-icon.svg`                      | Mark on a `#16161A` rounded tile.                                                                                                                                                                                                                      |
| `*-512.png`                                    | Transparent 512 x 512 renders of each SVG.                                                                                                                                                                                                             |
| `web/`                                         | `favicon.ico`, `favicon.svg`, `apple-touch-icon.png` and `head-snippet.html` (the `<link>` tags). Built from the main mark. Installable-app icons (192, 512, maskable) and a manifest are not included; generate them if the site becomes installable. |
| `veilo-presentation.html`                      | Presentation board with mockups.                                                                                                                                                                                                                       |

## Colour

The mark is one colour, equal to the text colour of the surface it sits on (the design system's monochrome accent).

| Surface | Surface colour | Mark colour |
| ------- | -------------- | ----------- |
| Dark    | `#16161A`      | `#E2E2E7`   |
| Light   | `#F1F1F3`      | `#1E1E22`   |

Screen use only for now: no CMYK or Pantone values are defined.

## Clear space

Keep at least **2 dot diameters** free on every side (one dot is about 8.5 % of the mark's height). The zone scales
with the logo.

## Minimum size

| Version                     | Screen                                              |
| --------------------------- | --------------------------------------------------- |
| `veilo-mark.svg`            | 32 px high                                          |
| Favicon (`web/favicon.svg`) | 16 px high; the dots blur but the ghost shape holds |

## Do

- Use the one-colour versions on photos or busy surfaces, on a calm area.
- Keep the ghost upright and the dissolving edge on the right.

## Don't

Stretch or squash it, recolour it outside the palette, rotate or mirror it, add shadows, outlines, gradients or
effects, change the dot sizes or spacing, or redraw it by hand. Edit the master and re-export instead.

## Notes for maintainers

- The marks are built on a dot grid of 9 columns by 10 rows; the dissolve starts in the
  last two columns.
- The design was made with the logo-design skill; the generating script is not part of the repo. The SVGs are the
  source of truth.
