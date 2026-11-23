// test-card.tsx: the card the playground animates: one of the home page's three demo cards (an
// inbox, a video tile or a music player) from card-layouts.ts, with its slot markup and hints.

import type { Reveal, RevealOptions, Settings } from "@veilo-ui/core";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { VideoView } from "../../home/demo-cards.tsx";
import { drawScene } from "../../home/demo-scenes.ts";
import { InboxView } from "../../home/inbox-card.tsx";
import { MusicView } from "../../home/music-card.tsx";
import { useAlbumCover } from "../../home/use-album-cover.ts";
import { CARD_LAYOUTS, DEFAULT_LAYOUT, type CardLayoutId } from "./card-layouts.ts";
import { drawImageCover, type CardImage } from "./image-source.ts";
import styles from "./test-card.module.css";
import { useReveal, type RevealStart } from "./use-reveal.ts";

/** Props of {@link TestCard}. */
export interface TestCardProps {
  /** The settings at mount. */
  settings: Settings;
  /** Reveal options, such as a test scheduler. */
  revealOptions?: RevealOptions;
  /** The card layout. Defaults to the product card. Read at mount: change the card's key. */
  layout?: CardLayoutId;
  /**
   * The user's text for this layout, by slot; parts without an entry show the layout's default.
   * Read at mount: change the card's key.
   */
  texts?: Record<string, string>;
  /**
   * The card width in CSS px; the layout's own width when absent. Read at mount: change the
   * card's key.
   */
  width?: number;
  /** The photo; the drawn placeholder when absent. Read at mount: change the card's key. */
  image?: CardImage | null;
  /**
   * The image area's width divided by its height. Defaults to 1 (square). Read at mount: change
   * the card's key.
   */
  ratio?: number;
  /** Called with a file dropped on the image area. */
  onImageDrop?: (file: File) => void;
  /** How the reveal starts at mount. Defaults to the full sequence. */
  start?: RevealStart;
  /** The progress to hold when `start` is `frame`. Read at mount. */
  frame?: number;
  /** Whether sequences loop: the first one (read at mount) and replays by click or key. */
  loop?: boolean;
  /** Receives the live reveal after mount and `null` after unmount. */
  onReveal?: (reveal: Reveal | null) => void;
}

/** Width changes smaller than this (CSS px) do not redraw the photo. */
const REDRAW_THRESHOLD = 2;

/**
 * The card itself, once its picture can be drawn. Click, Enter or Space replays the full sequence; a file dropped on the image area goes
 * to `onImageDrop`. With a `frame` start, the card gets `data-frame-ready` once the held frame
 * is drawn, which the visual tests wait for. Side effects: draws the photo (again when its width changes by 2 px or more)
 * and runs a reveal on the card while mounted.
 *
 * @param props - The settings, reveal options, photo and its ratio, drop handler, start, frame,
 *   loop flag and reveal callback.
 * @returns The card.
 */
function LiveTestCard(props: TestCardProps) {
  const card = useRef<HTMLElement>(null);
  const photo = useRef<HTMLCanvasElement>(null);

  // Read at mount, like the reveal: a new image comes with a new key, so a fresh card.
  const image = useRef(props.image ?? null);
  // The picture's shape is the card's design (16:9 for the video tile, square for the cover),
  // unless the layout lets the user choose one.
  const picture = CARD_LAYOUTS[props.layout ?? DEFAULT_LAYOUT].picture;
  const ratio = useRef(
    CARD_LAYOUTS[props.layout ?? DEFAULT_LAYOUT].hasRatio
      ? (props.ratio ?? 1)
      : (picture?.ratio ?? 1),
  );
  // Until the user picks a photo, the card shows the demo's own picture, as on the home page.
  const draw = (canvas: HTMLCanvasElement) => {
    if (image.current) {
      drawImageCover(canvas, image.current, ratio.current, window.devicePixelRatio);
    } else if (picture) {
      drawScene(canvas, picture.scene, ratio.current);
    }
  };

  // A layout effect runs before the reveal's effect, so the image is drawn before it is sampled.
  useLayoutEffect(() => {
    if (photo.current) draw(photo.current);
  }, []);

  // Redraw at the new size when the card's width changes noticeably.
  useEffect(() => {
    const canvas = photo.current;
    if (!canvas) return;
    let drawnWidth = canvas.clientWidth;
    const observer = new ResizeObserver(() => {
      if (Math.abs(canvas.clientWidth - drawnWidth) < REDRAW_THRESHOLD) return;
      drawnWidth = canvas.clientWidth;
      draw(canvas);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // The layout is read at mount, like the ratio: another layout comes with a new key.
  const [layout] = useState(() => CARD_LAYOUTS[props.layout ?? DEFAULT_LAYOUT]);
  // The user's text for this layout, read at mount too; parts without an edit show the default.
  const [edits] = useState(() => props.texts);
  // The width too: the layout's own unless the user chose one.
  const [width] = useState(() => props.width ?? layout.width);
  const [frameReady, setFrameReady] = useState(false);
  const reveal = useReveal(
    card,
    { version: 1, settings: props.settings, slots: layout.slots },
    props.revealOptions,
    {
      start: props.start,
      frame: props.frame,
      loop: props.loop,
      onReveal: props.onReveal,
      onFrameReady: () => setFrameReady(true),
    },
  );

  const replay = () => reveal.current?.playSequence({ loop: props.loop ?? false });
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    // Space would scroll the page otherwise.
    event.preventDefault();
    replay();
  };
  // The browser opens a dropped file unless dragover and drop are cancelled.
  const onDragOver = (event: DragEvent) => event.preventDefault();
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) props.onImageDrop?.(file);
  };

  // The picture's canvas, given the class that sizes it. Dropping a file on it loads that file.
  const renderPhoto = (className: string) => (
    <canvas
      ref={photo}
      className={className}
      style={{ aspectRatio: ratio.current }}
      data-veilo-slot={picture?.slot}
      aria-hidden="true"
      onDragOver={onDragOver}
      onDrop={onDrop}
    />
  );

  // The home page's card markup, as a button: click, Enter or Space replays the animation.
  const View = layout.id === "inbox" ? InboxView : layout.id === "video" ? VideoView : MusicView;
  return (
    <View
      innerRef={card}
      className={styles.card}
      style={{ width }}
      role="button"
      tabIndex={0}
      aria-label={`Test card, ${layout.name.toLowerCase()}. Press to replay the animation.`}
      data-frame-ready={frameReady ? "" : undefined}
      onClick={replay}
      onKeyDown={onKeyDown}
      texts={edits}
      renderPhoto={picture ? renderPhoto : undefined}
    />
  );
}

/**
 * The test card: the chosen demo card (an inbox, a video tile or a music player) as a button. The
 * music player's cover is a photograph that loads once; the card is created only after that, so
 * the reveal samples the photograph and not the drawn stand-in. Click, Enter or Space replays
 * the full sequence; a file dropped on the picture goes to `onImageDrop`. With a `frame` start,
 * the card gets `data-frame-ready` once the held frame is drawn, which the visual tests wait for.
 * Side effects: draws the picture (again when its width changes by 2 px or more) and runs a
 * reveal on the card while mounted; starts the shared cover load.
 *
 * @param props - The settings, reveal options, layout, text, width, photo, drop handler, start,
 *   frame, loop flag and reveal callback.
 * @returns The card, or nothing while the cover loads.
 */
export function TestCard(props: TestCardProps) {
  const coverReady = useAlbumCover();
  const layout = CARD_LAYOUTS[props.layout ?? DEFAULT_LAYOUT];
  const needsCover = !props.image && layout.picture?.scene === "album";
  if (needsCover && !coverReady) return null;
  return <LiveTestCard {...props} />;
}
