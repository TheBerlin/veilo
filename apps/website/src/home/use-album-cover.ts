// use-album-cover.ts: tells when the music card's cover photograph is ready to be sampled.

import { useEffect, useState } from "react";
import { albumCoverLoaded, preloadAlbumCover } from "./demo-scenes.ts";

/**
 * Tells whether the album cover photograph has loaded (or failed to, in which case the drawn art
 * stands in). The music card samples its cover when its reveal is created, so a card that must
 * show the photograph is rendered only once this is true.
 *
 * Side effects: starts the shared cover load if it has not started, and waits for it.
 *
 * @returns True when the music card can be created.
 */
export function useAlbumCover(): boolean {
  const [ready, setReady] = useState(albumCoverLoaded);
  useEffect(() => {
    if (ready) return;
    let current = true;
    void preloadAlbumCover().then(() => current && setReady(true));
    return () => {
      current = false;
    };
  }, [ready]);
  return ready;
}
