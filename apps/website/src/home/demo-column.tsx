// demo-column.tsx: the hero's demo on a wide screen: the three cards in one column instead of
// the single card with a switch. They reveal in a chain, one after the previous; a click on a
// card replays it, and the Replay button (or the R key) replays all three at once.

import type { Reveal, Settings } from "@veilo-ui/core";
import { Button, Kbd } from "@veilo-ui/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { VideoCard } from "./demo-cards.tsx";
import styles from "./demo-column.module.css";
import { InboxCard } from "./inbox-card.tsx";
import { MusicCard } from "./music-card.tsx";
import { useAlbumCover } from "./use-album-cover.ts";
import { useReplayKey } from "./use-replay-key.ts";

/** How long after the last card has finished the Replay button appears, in milliseconds. */
const REPLAY_DELAY = 1000;

/** The cards of the column, top to bottom. */
const COLUMN = [
  { id: "inbox", Card: InboxCard },
  { id: "video", Card: VideoCard },
  { id: "music", Card: MusicCard },
] as const;

/** Props of {@link DemoColumn}. */
export interface DemoColumnProps {
  /** The effect to play on every card: the skeleton loader and the reveal, as settings. */
  settings: Partial<Settings>;
  /** Whether the first card may appear (default). The hero holds it until its buttons are in. */
  start?: boolean;
}

/**
 * The three demo cards stacked in a column, centered, with one Replay button under them (a click
 * on a card replays only that card; the button, or the R key, replays all three at once, in place).
 * A hint about the simulated wait appears when the last card has finished for the first time, and
 * the button 1 s later; both then stay.
 * The photographic cards wait for their pictures, because a reveal samples the picture when it is
 * created.
 *
 * @param props - The effect.
 * @returns The column.
 */
export function DemoColumn(props: DemoColumnProps) {
  const ready = useAlbumCover();
  // The card whose turn it is: the others wait, unseen, until the card before them has finished.
  const [reached, setReached] = useState(0);
  // Before `start` nobody has a turn, so the first card is not seen either.
  const turn = props.start === false ? -1 : reached;
  // The hint appears when the last card has finished; the Replay button follows a second later.
  const [hintShown, setHintShown] = useState(false);
  const [replayShown, setReplayShown] = useState(false);
  const replayTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(replayTimer.current), []);
  const reveals = useRef(new Map<string, Reveal>());
  const track = useCallback(
    (id: string, index: number) => (reveal: Reveal | null) => {
      if (!reveal) {
        reveals.current.delete(id);
        return;
      }
      reveals.current.set(id, reveal);
      reveal.on("complete", () => {
        // Never moves back, so a click that replays an earlier card does not restart the chain.
        setReached((reached) => Math.max(reached, index + 1));
        if (index === COLUMN.length - 1) {
          setHintShown(true);
          clearTimeout(replayTimer.current);
          replayTimer.current = setTimeout(() => setReplayShown(true), REPLAY_DELAY);
        }
      });
    },
    [],
  );
  // One stable callback per card, so a card is not re-registered on every render.
  const trackers = useRef<Record<string, (reveal: Reveal | null) => void>>({});
  const trackerFor = (id: string, index: number) => (trackers.current[id] ??= track(id, index));

  const replayButton = useRef<HTMLButtonElement>(null);
  const pressed = useReplayKey(replayButton, replayShown);
  // Restarts all three cards at once, in place. The button stays where it is.
  const replayAll = () => {
    reveals.current.forEach((reveal) => reveal.playSequence());
  };

  return (
    <div className={styles.column}>
      {COLUMN.map(({ id, Card }, index) => (
        <div
          key={id}
          className={styles.item}
          data-waiting={turn < index || undefined}
          onClick={() => reveals.current.get(id)?.playSequence()}
        >
          {id !== "inbox" && !ready ? null : (
            <Card settings={props.settings} onReveal={trackerFor(id, index)} play={turn >= index} />
          )}
        </div>
      ))}
      {/* The wait on the skeleton is the effect's hold, which stands in for a real request. */}
      <p className={styles.hint} data-shown={hintShown || undefined}>
        The {props.settings.hold ?? 0}-second wait on each skeleton is simulated, standing in for a
        real request.
      </p>
      {/* Its space is kept while it is away, so nothing moves when it appears. */}
      <div className={styles.replay} data-shown={replayShown || undefined}>
        <Button
          ref={replayButton}
          size="sm"
          aria-label="Replay"
          aria-keyshortcuts="r"
          data-pressed={pressed || undefined}
          tabIndex={replayShown ? undefined : -1}
          onClick={replayAll}
        >
          Replay <Kbd>R</Kbd>
        </Button>
      </div>
    </div>
  );
}
