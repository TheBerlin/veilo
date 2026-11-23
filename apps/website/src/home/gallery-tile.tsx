// gallery-tile.tsx: one tile of the home page's gallery preview: a frame with the demo card on the
// real engine, the effect's name, its badges and a link that opens it in the playground. The tile
// rests on one frame of its effect; hover, keyboard focus or a press plays the whole effect once,
// and the tile then ignores every trigger until the effect has ended and a pause has passed.

import { findPreset } from "@veilo-ui/presets";
import { useReveal } from "@veilo-ui/react";
import { Badge, Button, Card } from "@veilo-ui/ui";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
} from "react";
import { PLAYGROUND_URL } from "../site/links.ts";
import { DemoPhoto } from "./demo-photo.tsx";
import { presetBadges, type GalleryTileSpec } from "./gallery-tiles.ts";
import styles from "./gallery-tile.module.css";
import { useAlbumCover } from "./use-album-cover.ts";
import { useSeen } from "./use-seen.ts";

/** Slot hints of the demo card: the photo and two lines of text. */
const CARD_LAYOUT = {
  version: 1,
  slots: {
    photo: { role: "image" },
    title: { role: "text", width: 90 },
    meta: { role: "text", width: 65 },
  },
} as const;

/** How long a tile ignores new triggers after its effect has ended, in milliseconds. */
export const REPLAY_PAUSE_MS = 3000;

/** Props of {@link GalleryTile}. */
export interface GalleryTileProps {
  /** The effect to show and how it rests. */
  spec: GalleryTileSpec;
}

/**
 * The address that opens the playground on a preset.
 *
 * @param id - The preset's id.
 * @returns The path and query.
 */
export function playgroundLinkFor(id: string): string {
  return `${PLAYGROUND_URL}?preset=${id}`;
}

/** Props of {@link DemoCard}. */
interface DemoCardProps {
  /** The tile's effect and how it rests. */
  spec: GalleryTileSpec;
  /** How many runs have been started; 0 means the card still rests. */
  run: number;
  /** Called when a run has reached its last frame. */
  onDone: () => void;
}

/**
 * The demo card inside the frame: a real reveal with the tile's preset, resting on a held frame
 * (or the still skeleton) and playing the whole sequence when asked. One reveal serves the tile for
 * its whole life: a change of state only tells it what to show, so nothing is rebuilt and nothing
 * flashes. A run is never cut short: nothing here stops it before its last frame.
 *
 * Side effects: creates a reveal through `useReveal` and destroys it on unmount; plays the sequence
 * whenever `run` grows, otherwise shows the rest frame; listens to the reveal's `complete` event.
 *
 * @param props - The tile, the run counter and the callback for the end of a run.
 * @returns The card, hidden from assistive technology.
 */
function DemoCard(props: DemoCardProps) {
  const { spec, run, onDone } = props;
  const { ref, reveal } = useReveal<HTMLDivElement>({ preset: spec.id, layout: CARD_LAYOUT });
  // The latest callback, so the listener below is attached once per reveal.
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => reveal?.on("complete", () => done.current()), [reveal]);
  useEffect(() => {
    if (!reveal) return;
    if (run > 0) reveal.playSequence();
    else if (spec.rest === "loading") reveal.showLoading();
    else reveal.seek(spec.rest);
  }, [reveal, run, spec.rest]);
  return (
    <div ref={ref} className={styles.card} aria-hidden="true">
      <DemoPhoto scene="album" ratio={3 / 2} slot="photo" className={styles.photo} />
      <p className={styles.title} data-veilo-slot="title">
        Aero desk lamp
      </p>
      <p className={styles.meta} data-veilo-slot="meta">
        $48 · In stock
      </p>
    </div>
  );
}

/**
 * One gallery tile. The frame is a button: hover, keyboard focus or a press plays the whole effect.
 * Leaving does not stop it. Until the effect has ended and {@link REPLAY_PAUSE_MS} have passed, every
 * further trigger is ignored; then the next one plays it again. The link under it opens the effect
 * in the playground.
 *
 * Side effects: loads the shared cover photograph; creates the tile's engine once the tile has been
 * scrolled into view; holds one timer for the pause, cleared on unmount.
 *
 * @param props - The tile's spec.
 * @returns The tile's article.
 */
export function GalleryTile(props: GalleryTileProps) {
  const { spec } = props;
  const preset = findPreset(spec.id)!;
  const ready = useAlbumCover();
  // The engine starts only once the tile has been scrolled near, so a page of many tiles does not
  // start them all at once.
  const { ref, seen } = useSeen<HTMLElement>();
  const [run, setRun] = useState(0);
  // Locked from the start of a run until its end plus the pause. A ref, because a trigger must see
  // the lock at once, before React has rendered again.
  const locked = useRef(false);
  const pause = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(pause.current), []);
  const start = useCallback(() => {
    if (locked.current) return;
    locked.current = true;
    setRun((count) => count + 1);
  }, []);
  const finish = useCallback(() => {
    clearTimeout(pause.current);
    pause.current = setTimeout(() => {
      locked.current = false;
    }, REPLAY_PAUSE_MS);
  }, []);
  return (
    <Card as="article" ref={ref} className={styles.tile} aria-label={preset.name}>
      <button
        type="button"
        className={styles.frame}
        data-rest={run === 0 ? "true" : undefined}
        aria-label={`Play the ${preset.name} effect`}
        onPointerEnter={(event: PointerEvent<HTMLButtonElement>) => {
          // Only a mouse hovers: a finger's tap arrives as a click.
          if (event.pointerType === "mouse") start();
        }}
        onFocus={(event: FocusEvent<HTMLButtonElement>) => {
          // Keyboard focus plays it, like a hover; a mouse press is handled by the click.
          if (event.currentTarget.matches(":focus-visible")) start();
        }}
        onClick={start}
      >
        {ready && seen ? <DemoCard spec={spec} run={run} onDone={finish} /> : null}
      </button>
      <h3 className={styles.name}>{preset.name}</h3>
      <ul className={styles.badges} aria-label="Effects">
        {presetBadges(spec.id).map((badge) => (
          <li key={badge}>
            <Badge>{badge}</Badge>
          </li>
        ))}
      </ul>
      <Button variant="secondary" size="sm" asChild>
        <a href={playgroundLinkFor(spec.id)}>Open in Playground</a>
      </Button>
    </Card>
  );
}
