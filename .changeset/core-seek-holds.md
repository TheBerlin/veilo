---
"@veilo-ui/core": patch
---

Hold a seeked frame: after `seek(p)` the reveal no longer starts running again when its element scrolls into view. Before, a card seeked while off screen played on from that frame as soon as it became visible. `resume()` still continues from the held frame.
