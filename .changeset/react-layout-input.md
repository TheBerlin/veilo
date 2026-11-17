---
"@veilo/react": minor
---

The `layout` prop of `Reveal`, `Skeleton` and `useReveal` now accepts a layout whose `settings` hold only the keys you change (the new `LayoutInput` type). Core already filled in the rest at run time; the type did not allow it, so the layout JSON the playground exports could not be pasted as it was.
