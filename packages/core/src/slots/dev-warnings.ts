// dev-warnings.ts: reports slot mismatches in development builds only.
// Layer 2. Writes to the console; no other side effects.

// Declared here instead of depending on Node's types: only `process.env.NODE_ENV` is read.
declare const process: { env: { NODE_ENV?: string } };

/**
 * Tells whether this is a development build.
 *
 * Bundlers such as Vite and webpack replace `process.env.NODE_ENV` with a string at build time,
 * so in production builds this becomes `"production" !== "production"` and the warning code can
 * be dropped. Without a bundler (a plain script tag) `process` does not exist and the read
 * throws, which counts as development.
 *
 * @returns `true` unless the build is a production build.
 */
export function isDevBuild(): boolean {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return true;
  }
}

/**
 * Prints slot problems as console warnings.
 *
 * @param problems - The messages, without the `Veilo:` prefix.
 * @param enabled - Whether to print; pass {@link isDevBuild} unless the user chose otherwise.
 */
export function warnSlotProblems(problems: readonly string[], enabled: boolean): void {
  if (!enabled) return;
  for (const problem of problems) console.warn(`Veilo: ${problem}`);
}
