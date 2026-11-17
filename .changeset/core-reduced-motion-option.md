---
"@veilo/core": minor
---

`reducedMotion` now controls the skeleton as well as the reveal. `generateLoaderCss`, `createSkeleton` and `createReveal` accept it: `true` writes the rule that stops the animation, `false` leaves the media rule out so the animation always runs (the playground's reduced-motion preview uses this), and leaving it out keeps the old output byte for byte. `serverSkeletonCss` still follows the visitor's setting.
