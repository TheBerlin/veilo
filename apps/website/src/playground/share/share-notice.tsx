// share-notice.tsx: loads a shared link's settings when the page opens, removes the fragment
// from the address bar, and says what happened in a message.

import { toast } from "@veilo-ui/ui";
import { useEffect } from "react";
import type { ContentStore } from "../state/content-store.ts";
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
  /** The content store the link's preview content (image ratio) is loaded into. */
  content?: ContentStore;
}

/**
 * Reads `window.location.hash` once at mount. A link's settings are loaded into the store, which
 * replays the full sequence, and its content into the content store; an unreadable link leaves
 * both as they are. Either way the fragment is removed with `history.replaceState`, so a reload
 * shows the current state, not the link again, and a message says what happened (nothing is shown
 * when there was no fragment). It draws nothing itself: the message is a toast, which the app's
 * Toaster shows. Side effects: changes the stores, the address bar, and shows a message.
 *
 * @param props - The stores.
 * @returns Nothing.
 */
export function ShareNotice(props: ShareNoticeProps) {
  const { store, content } = props;

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "" || hash === "#") return;
    // Decoding is async; a cleanup before it finishes (StrictMode's test unmount) drops the
    // result, and the second mount decodes again from the fragment, which is still there.
    let cancelled = false;
    void decodeShareLink(hash).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        // Content first: its change and the settings load then rebuild the card together.
        // A link from before content existed restores the defaults, which its sender saw.
        content?.getState().load(result.payload.content);
        store.getState().load(result.payload.settings);
        toast(LINK_LOADED);
      } else {
        toast(LINK_ERRORS[result.error]);
      }
      const { pathname, search } = window.location;
      window.history.replaceState(window.history.state, "", pathname + search);
    });
    return () => {
      cancelled = true;
    };
  }, [store, content]);

  return null;
}
