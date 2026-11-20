// shift-demo.tsx: the "Layout stays put" demo: one card with a divider the visitor can drag. Left of
// it, a typical loader (a simulation: its placeholder covers the photo but not the text, so when the
// text arrives the button under it jumps down). Right of it, Veilo (the real engine on a real card:
// the placeholder is the card itself, so the button never moves). Both load together on one loop,
// and the jump shows as the button sitting higher on one side of the divider than on the other.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { DemoPhoto } from "./demo-photo.tsx";
import { HERO_SETTINGS } from "./hero-effect.ts";
import styles from "./shift-demo.module.css";
import { useAlbumCover } from "./use-album-cover.ts";
import { useLoopingReveal } from "./use-looping-reveal.ts";
import { useReducedMotion } from "./use-reduced-motion.ts";
import type { DemoProps } from "./why-tiles.tsx";

/** Slot hints of the card: the photo and two lines of text. */
const CARD_LAYOUT = {
  version: 1,
  slots: {
    photo: { role: "image" },
    // Wide enough that, with the divider in the middle, both reserved lines show on its right.
    title: { role: "text", width: 90 },
    meta: { role: "text", width: 65 },
  },
} as const;

/** The card's words. */
const TITLE = "Aero desk lamp";
const META = "$48 · In stock";

/** One side's note about a part of the card. */
interface Note {
  /** The side it explains: a pain point of the typical loader, or how Veilo solves it. */
  side: "problem" | "solution";
  /** Which part of the card it points at. */
  row: "text" | "button";
  /** The words. */
  text: string;
}

/**
 * The notes, in reading order: a row of the typical loader's problem and Veilo's answer to it, then
 * the next row. On a wide screen each sits beside the part it is about; on a narrow one they form a
 * list under the card.
 */
const NOTES: readonly Note[] = [
  { side: "problem", row: "text", text: "No room kept for the text" },
  { side: "solution", row: "text", text: "Text lines are reserved" },
  { side: "problem", row: "button", text: "The button jumps when the text lands" },
  { side: "solution", row: "button", text: "The button never moves" },
];

/** Where the divider starts, in percent of the card's width. */
const START = 50;
/** How far an arrow key moves the divider, and how far with Shift held, in percent. */
const STEP = 5;
const BIG_STEP = 20;

/**
 * The card's photo and its two lines.
 *
 * @returns The three parts, each a slot for the reveal.
 */
function CardContent() {
  return (
    <>
      <DemoPhoto scene="album" ratio={2} slot="photo" className={styles.photo} />
      <p className={styles.title} data-veilo-slot="title">
        {TITLE}
      </p>
      <p className={styles.meta} data-veilo-slot="meta">
        {META}
      </p>
    </>
  );
}

/**
 * The button under the card: the neighbour that must not move.
 *
 * @returns The button, as plain decoration.
 */
function Buy() {
  return <div className={styles.buy}>Buy now</div>;
}

/** Props of {@link VeiloLayer}. */
interface VeiloLayerProps {
  /** Whether the tile has come into view. */
  active: boolean;
  /** Told whether the content is on screen, so the typical layer follows the same cycle. */
  onLoaded: (loaded: boolean) => void;
}

/**
 * The Veilo layer: a real reveal on the card, looping, with the button below it outside the card,
 * never touched. A visitor who asks for less motion gets the finished card, and the typical layer
 * stays on its loading state (see {@link ShiftDemo}).
 *
 * @param props - Whether the tile is active, and the callback for the cycle.
 * @returns The card and the button.
 */
function VeiloLayer(props: VeiloLayerProps) {
  const { active, onLoaded } = props;
  const { ref, state } = useLoopingReveal(HERO_SETTINGS, CARD_LAYOUT, active);
  // Loading is the only state without content; idle is before anything has started.
  useEffect(() => onLoaded(state !== "loading"), [state, onLoaded]);
  return (
    <div className={styles.stack}>
      <div ref={ref} className={styles.card}>
        <CardContent />
      </div>
      <Buy />
    </div>
  );
}

/** Props of {@link TypicalLayer}. */
interface TypicalLayerProps {
  /** Whether the content has arrived. */
  loaded: boolean;
}

/**
 * The typical layer: a gray box the size of the photo until the content arrives, then the photo
 * and the text under it, which was not reserved and pushes the button down.
 *
 * @param props - Whether the content has arrived.
 * @returns The card and the button.
 */
function TypicalLayer(props: TypicalLayerProps) {
  const { loaded } = props;
  return (
    <div className={styles.stack}>
      <div className={styles.card}>
        {loaded ? (
          <DemoPhoto scene="album" ratio={2} slot="photo" className={styles.photo} />
        ) : (
          <div className={styles.placeholder} />
        )}
        {loaded ? (
          <>
            <p className={styles.title}>{TITLE}</p>
            <p className={styles.meta}>{META}</p>
          </>
        ) : null}
      </div>
      <Buy />
    </div>
  );
}

/**
 * Keeps a position between 0 and 100 and turns pointer and key input into it.
 *
 * Side effects: none until the returned handlers are called; a press captures the pointer until it
 * is released.
 *
 * @returns The position, a ref for the area it is measured against, and the event handlers.
 */
function useDivider() {
  const [position, setPosition] = useState(START);
  const area = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const moveTo = useCallback((clientX: number) => {
    const box = area.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    setPosition(Math.min(100, Math.max(0, ((clientX - box.left) / box.width) * 100)));
  }, []);
  return {
    position,
    area,
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      dragging.current = true;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // A pointer that is not active (a synthetic event) cannot be captured; it still moves.
      }
      moveTo(event.clientX);
    },
    onPointerMove(event: PointerEvent<HTMLDivElement>) {
      if (dragging.current) moveTo(event.clientX);
    },
    onPointerUp() {
      dragging.current = false;
    },
    onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
      const step = event.shiftKey ? BIG_STEP : STEP;
      const targets: Record<string, number | undefined> = {
        ArrowLeft: position - step,
        ArrowDown: position - step,
        ArrowRight: position + step,
        ArrowUp: position + step,
        Home: 0,
        End: 100,
      };
      const target = targets[event.key];
      if (target === undefined) return;
      event.preventDefault();
      setPosition(Math.min(100, Math.max(0, target)));
    },
  };
}

/**
 * The demo. It waits for the photograph so the reveal can sample it, then plays once the tile is in
 * view. The divider is a slider: drag it, press anywhere on the card, or use the arrow keys (Shift
 * for bigger steps, Home and End for the ends). The two layers are decoration, hidden from
 * assistive technology; the slider has a name and a value.
 *
 * A visitor who asks for less motion gets one still picture, composed to carry the point: Veilo's
 * finished card on the right, and on the left a typical loader that is still loading, so its button
 * sits higher than Veilo's, which is where it ends up. Everyone else gets the loop.
 *
 * Side effects: loads the shared cover photograph; keeps the typical layer in step with the
 * reveal; captures the pointer while dragging; follows the motion preference.
 *
 * @param props - Whether the tile has come into view.
 * @returns The captions and the card with its divider.
 */
export function ShiftDemo(props: DemoProps) {
  const ready = useAlbumCover();
  const [loaded, setLoaded] = useState(true);
  const reduced = useReducedMotion();
  const divider = useDivider();
  const shown = Math.round(divider.position);
  return (
    <div className={styles.compare}>
      <div className={styles.captions} aria-hidden="true">
        <span>Typical loader</span>
        <span>Veilo</span>
      </div>
      <div className={styles.wrap}>
        <div
          ref={divider.area}
          className={styles.area}
          style={{ "--split": `${divider.position}%` } as CSSProperties}
          onPointerDown={divider.onPointerDown}
          onPointerMove={divider.onPointerMove}
          onPointerUp={divider.onPointerUp}
          onPointerCancel={divider.onPointerUp}
        >
          <div className={styles.layer} aria-hidden="true">
            {ready ? <VeiloLayer active={props.active} onLoaded={setLoaded} /> : null}
          </div>
          <div className={`${styles.layer} ${styles.before}`} aria-hidden="true">
            <TypicalLayer loaded={loaded && !reduced} />
          </div>
          <div className={styles.guide} aria-hidden="true" />
          <div className={styles.divider} aria-hidden="true" />
          <div
            className={styles.handle}
            role="slider"
            tabIndex={0}
            aria-label="Compare a typical loader with Veilo"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={shown}
            aria-valuetext={`${shown}% typical loader, ${100 - shown}% Veilo`}
            onKeyDown={divider.onKeyDown}
          >
            <span className={styles.grip} aria-hidden="true" />
          </div>
        </div>
        <ul className={styles.notes} aria-label="What differs">
          {NOTES.map((note) => (
            <li key={note.text} className={styles.note} data-side={note.side} data-row={note.row}>
              <span className={styles.tag}>{note.text}</span>
              <span className={styles.leader} aria-hidden="true" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
