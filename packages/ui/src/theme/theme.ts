// theme.ts: the page theme choice (spec 1.1). "system" follows the OS; "light" and "dark" set
// data-theme on the root element, which the design tokens honor. The choice is remembered per
// browser in localStorage, a convenience only: the page works the same when storage is blocked.

/** The theme the viewer chose. */
export type ThemeChoice = "system" | "light" | "dark";

/** The choices, in the order the switch shows them. */
export const THEME_CHOICES: readonly ThemeChoice[] = ["system", "light", "dark"];

/** localStorage key. index.html reads the same key before the first paint, so keep them equal. */
export const THEME_STORAGE_KEY = "veilo-theme";

/**
 * Narrows any value to a theme choice.
 *
 * @param value - A stored or typed value.
 * @returns The choice, or `"system"` for anything else.
 */
export function toThemeChoice(value: unknown): ThemeChoice {
  return value === "light" || value === "dark" ? value : "system";
}

/**
 * Reads the saved choice.
 *
 * @returns The saved choice, or `"system"` when none is saved or storage is blocked.
 */
export function readThemeChoice(): ThemeChoice {
  try {
    return toThemeChoice(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

/**
 * Applies a choice to the root element and saves it. Side effects: sets or removes
 * `data-theme` on `<html>` and writes localStorage (silently skipped when blocked).
 *
 * @param choice - The new choice.
 */
export function applyThemeChoice(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === "system") root.removeAttribute("data-theme");
  else root.dataset.theme = choice;
  try {
    if (choice === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Storage blocked (private window, site data off): the choice lasts for this visit only.
  }
}

/**
 * Calls back whenever the page's theme may have changed: `data-theme` on `<html>` changed, or
 * the OS switched between light and dark.
 *
 * @param callback - Called after each change.
 * @returns A function that stops watching.
 */
export function watchTheme(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  const media = matchMedia("(prefers-color-scheme: light)");
  media.addEventListener("change", callback);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", callback);
  };
}
