// release.ts: the version of the latest release, which decides what is labeled "New". The build
// writes it in from the core package's version; a test or a dev server without it gets "0.0.0",
// which labels nothing.

/** Written by the Vite build (`define`): the version of `@veilo-ui/core`. */
declare const __VEILO_RELEASE__: string | undefined;

/** The latest released version, for example `"0.9.0"`. */
export const LATEST_RELEASE: string =
  typeof __VEILO_RELEASE__ === "string" ? __VEILO_RELEASE__ : "0.0.0";
