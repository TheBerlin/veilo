// define-entry.ts: the entry `@veilo/element/define`. Importing it registers the elements, for
// apps that use them as plain tags and never touch the classes.

import { defineVeiloElements } from "./define.ts";

// A server import (no custom element registry) registers nothing instead of throwing.
if (typeof customElements !== "undefined") defineVeiloElements();
