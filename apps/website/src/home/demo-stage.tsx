// demo-stage.tsx: the hero's demo: one of the three cards with a status row under it. The card
// plays once; a click on it, on Replay, or the R key (held, then released) plays it again.

import type { Reveal, Settings } from "@veilo-ui/core";
import { Button, Kbd } from "@veilo-ui/ui";
import { useEffect, useRef, useState } from "react";
import { VideoCard } from "./demo-cards.tsx";
import { InboxCard } from "./inbox-card.tsx";
import { MusicCard } from "./music-card.tsx";
import { DemoReadout } from "./demo-readout.tsx";
import styles from "./demo-stage.module.css";
import { useAlbumCover } from "./use-album-cover.ts";

/** The components the hero can show, with their labels. */
export const DEMO_KINDS = [
  { id: "inbox", label: "Inbox" },
  { id: "video", label: "Video" },
  { id: "music", label: "Music" },
] as const;

/** One of {@link DEMO_KINDS}. */
export type DemoKind = (typeof DEMO_KINDS)[number]["id"];

/** The card component for each kind. */
const CARDS = { inbox: InboxCard, video: VideoCard, music: MusicCard } as const;

/** Props of {@link DemoStage}. */
export interface DemoStageProps {
  /** Which component to show. */
  kind: DemoKind;
  /** The effect to play on it: the skeleton loader and the reveal, as settings. */
  settings: Partial<Settings>;
}

/**
 * The chosen card, which plays its sequence once when it appears (or when the kind changes) and rests on the finished card. A click on the card, or on the Replay button for
 * keyboard and screen-reader users, or the R key, plays it again.
 *
 * @param props - The kind and the effect.
 * @returns The card area and the status row.
 */
export function DemoStage(props: DemoStageProps) {
  const { kind, settings } = props;
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const Card = CARDS[kind];

  // The music card samples its cover when its reveal is created, so it waits for the photograph.
  const coverReady = useAlbumCover();
  const waiting = kind === "music" && !coverReady;

  const replayButton = useRef<HTMLButtonElement>(null);
  const [pressed, setPressed] = useState(false);

  // The R key imitates a mouse click on the Replay button. The button shows pressed for as long
  // as the key is held (a mouse-down), and the click, which replays, happens when the key is
  // released (a mouse-up). If the window loses focus while the key is held, the press is
  // cancelled with no click, as when a pointer is dragged off a button. The key is left alone
  // while the visitor types in a field, when a modifier is held (Ctrl+R and Cmd+R reload the
  // page) and on key repeat.
  useEffect(() => {
    let held = false;
    const release = () => {
      held = false;
      setPressed(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "r" || event.repeat) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      held = true;
      setPressed(true);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (!held || event.key.toLowerCase() !== "r") return;
      release();
      replayButton.current?.click();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", release);
    };
  }, []);
  return (
    <div className={styles.stage}>
      {/* A click anywhere on the component replays it; Replay below is the keyboard way. */}
      <div className={styles.area} onClick={() => reveal?.playSequence()}>
        {/* The key rebuilds the card, and so its reveal, when the kind changes. */}
        {waiting ? null : <Card key={kind} settings={settings} onReveal={setReveal} />}
      </div>
      <div className={styles.status}>
        <DemoReadout reveal={reveal} />
        <Button
          ref={replayButton}
          size="sm"
          aria-label="Replay"
          aria-keyshortcuts="r"
          data-pressed={pressed || undefined}
          onClick={() => reveal?.playSequence()}
        >
          Replay <Kbd>R</Kbd>
        </Button>
      </div>
    </div>
  );
}
