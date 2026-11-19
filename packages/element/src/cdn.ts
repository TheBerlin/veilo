// cdn.ts: the entry of the CDN bundle `cdn.js`, one file with core, presets and Lit inside for a
// plain `<script type="module">`. Registers the elements on load and exports the same API as
// `@veilo-ui/element`, so a module script can also import the classes from it.

import { defineVeiloElements } from "./define.ts";

export * from "./index.ts";

defineVeiloElements();
