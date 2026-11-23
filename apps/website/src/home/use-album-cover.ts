// use-album-cover.ts: tells when the music card's cover photograph is ready to be sampled.

import { useEffect, useState } from "react";
import { photoLoaded, preloadPhoto } from "./demo-scenes.ts";

/**
 * Tells whether the album cover and the video thumbnail photographs have loaded (or failed to, in which case the drawn art
 * stands in). The music card samples its cover when its reveal is created, so a card that must
 * show the photograph is rendered only once this is true.
 *
 * Side effects: starts the shared cover load if it has not started, and waits for it.
 *
 * @returns True when the photographic cards can be created.
 */
export function useAlbumCover(): boolean {
  const [ready, setReady] = useState(() => photoLoaded("album") && photoLoaded("video"));
  useEffect(() => {
    if (ready) return;
    let current = true;
    void Promise.all([preloadPhoto("album"), preloadPhoto("video")]).then(
      () => current && setReady(true),
    );
    return () => {
      current = false;
    };
  }, [ready]);
  return ready;
}
