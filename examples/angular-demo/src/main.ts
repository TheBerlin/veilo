// main.ts: starts the demo. Zoneless: nothing here needs zone.js, and the Veilo directives run
// outside the zone anyway.

import { provideZonelessChangeDetection } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { App } from "./app";

bootstrapApplication(App, { providers: [provideZonelessChangeDetection()] }).catch((error) =>
  console.error(error),
);
