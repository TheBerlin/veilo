---
"@veilo-ui/core": minor
"@veilo-ui/css": minor
"@veilo-ui/presets": minor
---

Changes from the review of the settings format before its freeze at 1.0.

- **The loader's default easing is now `inOut`** (it was `out`), and the skeleton's fallback colors are `#d4d4d4` and `#f8f8f8` (they were `#dcdcdc` and `#f7f7f7`). With `out`, the highlight crossed each bar in a quick flash and then left a long still; the new defaults give a steadier glide and raise the band's contrast against the base from 1.28 to 1.40. Anything that leaves `lEase` unset, `skeleton.css` and every preset that does not set its own easing look different. Settings that name `lEase` are unchanged.
- **`cols` is a whole number.** A fraction such as `64.5` is rounded when it is read, and the JSON Schema says `integer`.
- **`parseSettings` and `parseLayout` report a newer version.** When the input's `version` is newer than the package reads, the result has `newerVersion`. The input is still read leniently, as before.
- Golden tests now pin the settings table, layouts, share links and presets files.
