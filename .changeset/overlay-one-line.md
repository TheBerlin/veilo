---
"@veilo-ui/core": patch
---

Keep the scramble and typewriter overlay of a one-line text on one line. The scrambled characters are wider or narrower than the real ones, so the overlay of a title could wrap onto a second line and jump over the next element. It now stays on one line and is clipped at the element's edge. Multi-line text still wraps like the real text.
