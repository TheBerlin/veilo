// demo-player.tsx: the playground demo video of "How it works" > Tune. It plays in a loop once on
// screen, has its own controls (play and pause, a draggable timeline, the time) and opens in a larger
// watch mode, with the browser's full controls, when the visitor clicks it.

import { Button, Scrubber } from "@veilo-ui/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import demoPoster from "./assets/clips/playground-demo.jpg";
import demoVideo from "./assets/clips/playground-demo.mp4";
import styles from "./demo-player.module.css";
import { useReducedMotion } from "./use-reduced-motion.ts";
import { useSeen } from "./use-seen.ts";

/**
 * Formats seconds as `m:ss`.
 *
 * @param seconds - A time in seconds; anything not finite or below 0 counts as 0.
 * @returns The text, for example `"1:05"`.
 */
export function formatTime(seconds: number): string {
  const whole = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** Props of {@link PlayPauseIcon}. */
interface PlayPauseIconProps {
  /** Whether the video is playing. */
  playing: boolean;
}

/**
 * The play and pause icons stacked in one slot. Both stay in the DOM; `data-state` decides which one
 * is shown, and the other fades out with a little blur and scale (transitions.dev "Icon swap").
 *
 * @param props - Whether the video is playing.
 * @returns The icon slot.
 */
function PlayPauseIcon(props: PlayPauseIconProps) {
  return (
    <span className={styles.swap} data-state={props.playing ? "b" : "a"} aria-hidden="true">
      <svg className={styles.swapIcon} data-icon="a" viewBox="0 0 16 16" width="16" height="16">
        <path
          d="M4.5 2.8v10.4a.6.6 0 0 0 .9.5l8.2-5.2a.6.6 0 0 0 0-1L5.4 2.3a.6.6 0 0 0-.9.5Z"
          fill="currentColor"
        />
      </svg>
      <svg className={styles.swapIcon} data-icon="b" viewBox="0 0 16 16" width="16" height="16">
        <rect x="3.5" y="2.5" width="3.2" height="11" rx="1" fill="currentColor" />
        <rect x="9.3" y="2.5" width="3.2" height="11" rx="1" fill="currentColor" />
      </svg>
    </span>
  );
}

/** Props of {@link DemoPlayer}. */
export interface DemoPlayerProps {
  /** What the video shows, in words, for assistive technology. */
  description: string;
}

/**
 * The demo video with a control row under it. The video starts when it first comes into view
 * (unless the visitor asks for less motion), loops and is muted. Clicking the picture, or the
 * "Watch larger" button, opens a modal `<dialog>` with a bigger video and the browser's own
 * controls and sound; closing it returns the inline video to the same moment.
 *
 * Side effects: plays and pauses the video elements; runs an animation-frame loop while playing so
 * the timeline moves smoothly; the file is requested once the video is near view.
 *
 * @param props - The description.
 * @returns The player's figure.
 */
export function DemoPlayer(props: DemoPlayerProps) {
  const { description } = props;
  const reduced = useReducedMotion();
  const { ref, seen } = useSeen<HTMLElement>();
  const video = useRef<HTMLVideoElement | null>(null);
  const dialog = useRef<HTMLDialogElement | null>(null);
  const largeVideo = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [large, setLarge] = useState(false);
  // A visitor's own Pause is kept, so scrolling back into view does not restart the video.
  const chosenPause = useRef(false);

  // Start the video the first time it is seen, unless motion is reduced or the visitor paused.
  useEffect(() => {
    const element = video.current;
    if (!element || !seen || reduced || chosenPause.current) return;
    void element.play().catch(() => {});
  }, [seen, reduced]);

  // While playing, follow the video every frame (`timeupdate` fires only about 4 times a second).
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      if (video.current) setTime(video.current.currentTime);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const toggle = useCallback(() => {
    const element = video.current;
    if (!element) return;
    if (element.paused) {
      chosenPause.current = false;
      void element.play().catch(() => {});
    } else {
      chosenPause.current = true;
      element.pause();
    }
  }, []);

  /** Opens the larger watch mode at the inline video's moment. */
  const open = useCallback(() => {
    const inline = video.current;
    inline?.pause();
    setLarge(true);
    // The large video exists only while open, so wait for it before starting it.
    requestAnimationFrame(() => {
      const big = largeVideo.current;
      if (big && inline) big.currentTime = inline.currentTime;
      dialog.current?.showModal();
      void big?.play().catch(() => {});
    });
  }, []);

  /**
   * Asks the dialog to close: it plays the opening animation backwards (marked by `data-closing`)
   * and closes when that ends. With reduced motion, or when no animation runs, it closes at once.
   */
  const requestClose = useCallback(() => {
    const element = dialog.current;
    if (!element?.open || element.dataset.closing) return;
    if (reduced) {
      element.close();
      return;
    }
    element.dataset.closing = "true";
    // `animationend` is the normal signal; the timer covers an animation that never starts.
    const done = () => {
      clearTimeout(timer);
      element.removeEventListener("animationend", onEnd);
      delete element.dataset.closing;
      element.close();
    };
    const onEnd = (event: AnimationEvent) => {
      if (event.target === element) done();
    };
    const timer = setTimeout(done, 400);
    element.addEventListener("animationend", onEnd);
  }, [reduced]);

  /** Closes the larger mode: the inline video continues from where the visitor stopped. */
  const closed = useCallback(() => {
    const inline = video.current;
    if (inline && largeVideo.current) inline.currentTime = largeVideo.current.currentTime;
    setLarge(false);
    if (!chosenPause.current && !reduced) void inline?.play().catch(() => {});
  }, [reduced]);

  return (
    <figure ref={ref} className={styles.player}>
      <button
        type="button"
        className={styles.frame}
        onClick={open}
        aria-label="Watch the demo larger"
      >
        <video
          ref={video}
          className={styles.media}
          src={seen ? demoVideo : undefined}
          poster={demoPoster}
          aria-label={description}
          muted
          loop
          playsInline
          preload={seen ? "auto" : "none"}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
          onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        />
        <span className={styles.hint} aria-hidden="true">
          Click to enlarge
        </span>
      </button>
      <div className={styles.controls}>
        <Button
          size="sm"
          variant="secondary"
          iconOnly
          aria-label={playing ? "Pause the demo" : "Play the demo"}
          onClick={toggle}
          icon={<PlayPauseIcon playing={playing} />}
        />
        <Scrubber
          className={styles.timeline}
          aria-label="Demo timeline"
          value={duration > 0 ? Math.min(time / duration, 1) : 0}
          disabled={duration === 0}
          onValueChange={(progress) => {
            const element = video.current;
            if (!element || duration === 0) return;
            element.currentTime = progress * duration;
            setTime(element.currentTime);
          }}
        />
        <span className={styles.time} aria-hidden="true">
          {formatTime(time)} / {formatTime(duration)}
        </span>
      </div>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-label="Playground demo"
        onClose={closed}
        // Esc would close at once; take it over so the closing animation plays.
        onCancel={(event) => {
          event.preventDefault();
          requestClose();
        }}
        // A click on the backdrop lands on the dialog itself, not on its content.
        onClick={(event) => {
          if (event.target === event.currentTarget) requestClose();
        }}
      >
        {large ? (
          <>
            <video
              ref={largeVideo}
              className={styles.largeMedia}
              src={demoVideo}
              poster={demoPoster}
              aria-label={description}
              controls
              playsInline
            />
            <Button size="sm" variant="secondary" className={styles.close} onClick={requestClose}>
              Close
            </Button>
          </>
        ) : null}
      </dialog>
    </figure>
  );
}
