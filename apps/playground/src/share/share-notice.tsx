// share-notice.tsx: loads a shared link's settings when the page opens, removes the fragment
// from the address bar, and says what happened.

import { useEffect, useState } from "react";
import type { SettingsStore } from "../state/settings-store.ts";
import { decodeShareLink, type ShareError } from "./share-link.ts";

/** The message after a link loaded. */
export const LINK_LOADED = "Shared settings loaded.";

/** The messages for a link that could not be read. */
export const LINK_ERRORS: Record<ShareError, string> = {
  invalid: "This link could not be read, so the playground opened with its usual settings.",
  newer:
    "This link was made by a newer version of Veilo, so the playground opened with its usual settings.",
};

/** Props of {@link ShareNotice}. */
export interface ShareNoticeProps {
  /** The settings store the link's settings are loaded into. */
  store: SettingsStore;
  /** Class for the message line. */
  className?: string;
}

/**
 * Reads `window.location.hash` once at mount. A link's settings are loaded into the store, which
 * replays the full sequence; an unreadable link leaves the store as it is. Either way the
 * fragment is removed with `history.replaceState`, so a reload shows the current state, not the
 * link again. Renders a polite live region with the result (empty when there was no fragment).
 * Side effects: changes the store and the address bar.
 *
 * @param props - The store and a class name.
 * @returns The message line.
 */
export function ShareNotice(props: ShareNoticeProps) {
  const { store, className } = props;
  const [message, setMessage] = useState("");

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "" || hash === "#") return;
    // Decoding is async; a cleanup before it finishes (StrictMode's test unmount) drops the
    // result, and the second mount decodes again from the fragment, which is still there.
    let cancelled = false;
    void decodeShareLink(hash).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        store.getState().load(result.payload.settings);
        setMessage(LINK_LOADED);
      } else {
        setMessage(LINK_ERRORS[result.error]);
      }
      const { pathname, search } = window.location;
      window.history.replaceState(window.history.state, "", pathname + search);
    });
    return () => {
      cancelled = true;
    };
  }, [store]);

  return (
    <p className={className} aria-live="polite">
      {message}
    </p>
  );
}
