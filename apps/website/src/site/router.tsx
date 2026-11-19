// router.tsx: the site's small client-side router: the current path from the History API, and
// navigation by an ordinary link click. No dependency: the site has a handful of fixed pages.

import { useEffect, useState } from "react";

/**
 * Whether a click on a link should be handled in the page: a plain left click on a same-origin
 * link that opens in this tab and is not a download or a bare `#fragment` on the same page.
 *
 * @param event - The click event.
 * @param anchor - The link that was clicked.
 * @returns True when the router should navigate instead of the browser.
 */
export function isInternalNavigation(event: MouseEvent, anchor: HTMLAnchorElement): boolean {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  // A fragment on the page already shown is the browser's own scroll.
  return !(url.pathname === window.location.pathname && url.hash !== "");
}

/**
 * The current path (`/`, `/playground`), following the address bar. Clicks on same-origin links
 * anywhere in the document go through the History API instead of loading a page, so the header,
 * the footer and the theme switch stay mounted and keep their state. After a navigation the page
 * scrolls to the top, and keyboard focus goes to the main landmark.
 *
 * Side effects: adds a document click listener and a `popstate` listener while mounted, and calls
 * `history.pushState`.
 *
 * @returns The current `location.pathname` without a trailing slash (except the root).
 */
export function usePath(): string {
  const [path, setPath] = useState(() => normalize(window.location.pathname));
  useEffect(() => {
    const sync = () => setPath(normalize(window.location.pathname));
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || !isInternalNavigation(event, anchor)) return;
      event.preventDefault();
      const url = new URL(anchor.href, window.location.href);
      history.pushState(null, "", url.pathname + url.search + url.hash);
      sync();
      window.scrollTo(0, 0);
      document.getElementById("main")?.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", sync);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", sync);
    };
  }, []);
  return path;
}

/**
 * Drops a trailing slash, so `/playground/` and `/playground` are one page.
 *
 * @param pathname - A `location.pathname`.
 * @returns The path without a trailing slash, or `/`.
 */
function normalize(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") || "/" : "/";
}
