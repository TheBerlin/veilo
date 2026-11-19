// browser-storage.ts: finds the browser's localStorage without throwing, for the last session
// and My presets. Reading `localStorage` itself throws when site data is blocked.

/** The part of the Web Storage API the playground uses, so tests can pass a plain fake. */
export type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * The page's localStorage, when it can be used.
 *
 * @returns The storage, or `null` when there is none (server, Node) or access is blocked
 *   (some private windows, site data turned off).
 */
export function browserStorage(): KeyValueStorage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    // Some browsers allow reading the object but throw on the first write; probe once.
    const probe = "veilo-probe";
    localStorage.setItem(probe, probe);
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}
