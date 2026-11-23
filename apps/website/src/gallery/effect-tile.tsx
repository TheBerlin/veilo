// effect-tile.tsx: one gallery card: the live preview with its status labels, the name, what the
// effect does, how it is made, and one action: how to use it. Descriptive facts are plain text;
// only status ("New", the season) is a badge, so nothing that looks like a control is not one.

import type { FlakeShape } from "@veilo-ui/seasonal";
import { Badge, Button, Card } from "@veilo-ui/ui";
import { EffectCanvas } from "./effect-canvas.tsx";
import styles from "./effect-tile.module.css";
import { metaLine, type EffectLabel, type GalleryEffect } from "./effects.ts";

/** Props of {@link EffectTile}. */
export interface EffectTileProps {
  /** The effect to show. */
  effect: GalleryEffect;
  /** The status labels to put on the preview, at most two. */
  labels: readonly EffectLabel[];
  /** The flake form, for the effects that draw a flake. */
  shape: FlakeShape;
  /** Called when the visitor asks how to use the effect in a project. */
  onUse: (effect: GalleryEffect) => void;
}

/**
 * The accessible name of a preview: the effect, its status, and how to play it.
 *
 * @param effect - The effect.
 * @param labels - Its status labels.
 * @returns For example "Dot matrix, New, animated preview, plays on hover or Enter".
 */
export function previewLabel(effect: GalleryEffect, labels: readonly EffectLabel[]): string {
  const status = labels.map((label) => label.text).join(", ");
  return `${effect.name}${status ? `, ${status}` : ""}, animated preview, plays on hover or Enter`;
}

/**
 * One gallery card. The preview rests on a still frame and plays on hover, press or Enter.
 *
 * @param props - The effect, its labels, the flake form and the handler for "Use in your project".
 * @returns The card, as an article.
 */
export function EffectTile(props: EffectTileProps) {
  const { effect, labels, shape, onUse } = props;
  return (
    <Card as="article" className={styles.tile} aria-labelledby={`effect-${effect.id}`}>
      <div className={styles.preview}>
        <EffectCanvas
          id={effect.id}
          shape={shape}
          label={previewLabel(effect, labels)}
          className={styles.canvas}
        />
        {/* A small mark at rest; it fades while the effect runs (the canvas sets data-state). */}
        <span className={styles.cue} aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M2 1v8l7-4z" fill="currentColor" />
          </svg>
        </span>
        {labels.length > 0 ? (
          <div className={styles.labels}>
            {labels.map((label) => (
              <Badge key={label.text} variant={label.tone === "new" ? "solid" : "outline"}>
                {label.text}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      <div className={styles.text}>
        <h3 id={`effect-${effect.id}`} className={styles.name}>
          {effect.name}
        </h3>
        <p className={styles.does}>{effect.does}</p>
        <p className={styles.meta}>{metaLine(effect)}</p>
      </div>
      <Button variant="secondary" size="sm" className={styles.action} onClick={() => onUse(effect)}>
        Use in your project
      </Button>
    </Card>
  );
}
