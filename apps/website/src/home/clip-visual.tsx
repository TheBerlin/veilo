// clip-visual.tsx: a short silent clip of the real playground, for "How it works". It plays in a
// loop once it is on screen, follows the page's theme, has a Pause button, and gives a visitor who
// asks for less motion one still frame.

import { Button, watchTheme } from "@veilo-ui/ui";
import { useEffect, useState, useSyncExternalStore } from "react";
import exportDark from "./assets/clips/export-dark.webm";
import exportDarkPoster from "./assets/clips/export-dark.png";
import exportLight from "./assets/clips/export-light.webm";
import exportLightPoster from "./assets/clips/export-light.png";
import tuneDark from "./assets/clips/tune-dark.webm";
import tuneDarkPoster from "./assets/clips/tune-dark.png";
import tuneLight from "./assets/clips/tune-light.webm";
import tuneLightPoster from "./assets/clips/tune-light.png";
import styles from "./clip-visual.module.css";
import { useReducedMotion } from "./use-reduced-motion.ts";
import { useSeen } from "./use-seen.ts";

/** The clips there are, each recorded in both themes by `scripts/record-clips.mjs`. */
export type ClipName = "tune" | "export";

/** The video and still frame of each clip and theme. */
const CLIPS: Record<ClipName, Record<"dark" | "light", { video: string; poster: string }>> = {
  tune: {
    dark: { video: tuneDark, poster: tuneDarkPoster },
    light: { video: tuneLight, poster: tuneLightPoster },
  },
  export: {
    dark: { video: exportDark, poster: exportDarkPoster },
    light: { video: exportLight, poster: exportLightPoster },
  },
};

/**
 * Tells which theme the page shows: the saved choice on `<html data-theme>`, or else the system's.
 *
 * Side effects: follows theme changes while mounted. Without a document the answer is dark, the
 * default theme.
 *
 * @returns `"light"` or `"dark"`.
 */
function useTheme(): "light" | "dark" {
  return useSyncExternalStore(
    (notify) => (typeof document === "undefined" ? () => {} : watchTheme(notify)),
    () => {
      if (typeof document === "undefined") return "dark";
      const chosen = document.documentElement.getAttribute("data-theme");
      if (chosen === "light" || chosen === "dark") return chosen;
      return matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    },
    () => "dark",
  );
}

/** Props of {@link ClipVisual}. */
export interface ClipVisualProps {
  /** Which clip. */
  name: ClipName;
  /** What the clip shows, in words, for assistive technology. */
  description: string;
}

/**
 * A clip of the playground. The video starts when it first comes into view and loops, muted, with
 * a Pause button (a loop that runs by itself must be stoppable). For a visitor who asks for less
 * motion there is no video at all, only the still frame.
 *
 * Side effects: plays and pauses the video element; the file is only requested once the clip is
 * near view.
 *
 * @param props - The clip and its description.
 * @returns The clip's figure.
 */
export function ClipVisual(props: ClipVisualProps) {
  const { name, description } = props;
  const theme = useTheme();
  const reduced = useReducedMotion();
  const { ref, seen } = useSeen<HTMLElement>();
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [paused, setPaused] = useState(false);
  const clip = CLIPS[name][theme];

  // Start (or stop) the video as the visitor's choice and the viewport allow.
  useEffect(() => {
    if (!video || !seen) return;
    if (paused) video.pause();
    else void video.play().catch(() => setPaused(true));
  }, [video, seen, paused, clip.video]);

  return (
    <figure ref={ref} className={styles.clip}>
      {reduced || !seen ? (
        <img className={styles.media} src={clip.poster} alt={description} />
      ) : (
        <video
          ref={setVideo}
          className={styles.media}
          src={clip.video}
          poster={clip.poster}
          aria-label={description}
          muted
          loop
          playsInline
          preload="auto"
        />
      )}
      {reduced ? null : (
        <Button
          size="sm"
          variant="secondary"
          className={styles.pause}
          aria-label={paused ? "Play the clip" : "Pause the clip"}
          onClick={() => setPaused((now) => !now)}
        >
          {paused ? "Play" : "Pause"}
        </Button>
      )}
    </figure>
  );
}
