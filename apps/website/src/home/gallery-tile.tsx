// gallery-tile.tsx: one tile of the home page's gallery preview: a frame with the demo card on the
// real engine, the effect's name, its badges and a link that opens it in the playground. The tile
// rests on one frame of its effect; hover, keyboard focus or a press plays the effect once.

import { findPreset } from "@veilo-ui/presets";
import { useReveal } from "@veilo-ui/react";
import { Badge, Button, Card } from "@veilo-ui/ui";
import { useEffect, useState, type FocusEvent, type PointerEvent } from "react";
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
  /** Whether the effect is playing now; otherwise the card rests. */
  playing: boolean;
  /** A counter that makes a press play the effect again. */
  run: number;
}

/**
 * The demo card inside the frame: a real reveal with the tile's preset, resting on a held frame
 * (or the still skeleton) and playing once when asked. One reveal serves the tile for its whole
 * life: a change of state only tells it what to show, so nothing is rebuilt and nothing flashes.
 *
 * Side effects: creates a reveal through `useReveal` and destroys it on unmount; seeks, shows the
 * skeleton or plays whenever `playing`, `run` or the rest state change.
 *
 * @param props - The tile, whether it is playing, and a counter that replays a run.
 * @returns The card, hidden from assistive technology.
 */
function DemoCard(props: DemoCardProps) {
  const { spec, playing, run } = props;
  const { ref, reveal } = useReveal<HTMLDivElement>({ preset: spec.id, layout: CARD_LAYOUT });
  useEffect(() => {
    if (!reveal) return;
    if (playing) reveal.playSequence();
    else if (spec.rest === "loading") reveal.showLoading();
    else reveal.seek(spec.rest);
  }, [reveal, playing, run, spec.rest]);
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
 * One gallery tile. The frame is a button: hover, keyboard focus or a press plays the effect, and
 * leaving or blurring returns it to its resting frame. The link under it opens the effect in the
 * playground.
 *
 * Side effects: loads the shared cover photograph; creates the tile's engine once the tile has been
 * scrolled into view.
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
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState(0);
  return (
    <Card as="article" ref={ref} className={styles.tile} aria-label={preset.name}>
      <button
        type="button"
        className={styles.frame}
        data-rest={playing ? undefined : "true"}
        aria-label={`Play the ${preset.name} effect`}
        onPointerEnter={(event: PointerEvent<HTMLButtonElement>) => {
          // Only a mouse hovers: a finger's tap arrives as a click.
          if (event.pointerType === "mouse") setPlaying(true);
        }}
        onPointerLeave={(event: PointerEvent<HTMLButtonElement>) => {
          if (event.pointerType === "mouse") setPlaying(false);
        }}
        onFocus={(event: FocusEvent<HTMLButtonElement>) => {
          // Keyboard focus plays it, like a hover; a mouse press is handled by the click.
          if (event.currentTarget.matches(":focus-visible")) setPlaying(true);
        }}
        onBlur={() => setPlaying(false)}
        onClick={() => {
          setPlaying(true);
          setRun((count) => count + 1);
        }}
      >
        {ready && seen ? <DemoCard spec={spec} playing={playing} run={run} /> : null}
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
