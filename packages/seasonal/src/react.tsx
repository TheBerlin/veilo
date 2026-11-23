// react.tsx: the React component of @veilo-ui/seasonal: `<SeasonalEffect name="frost" />`.

import { useEffect, useRef, type CSSProperties } from "react";
import type { FlakeShape } from "./flake.ts";
import { mountEffect, type EffectHandle, type EffectMode } from "./mount.ts";
import type { EffectId } from "./variants.ts";

/** Props of {@link SeasonalEffect}. */
export interface SeasonalEffectProps {
  /** The effect's id, for example `"frost"`. Changing it swaps the effect. */
  name: EffectId;
  /** The flake form, for the effects that draw a flake. Defaults to `dendrite`. */
  shape?: FlakeShape;
  /** How it runs: `loop` (default), `hover` or `still`. */
  mode?: EffectMode;
  /** The accessible name. Defaults to the effect's id plus "animation". */
  label?: string;
  /** Class for the canvas. Give it a size: the effect fills it. */
  className?: string;
  /** Inline style for the canvas. Give it a size: the effect fills it. */
  style?: CSSProperties;
}

/**
 * A seasonal effect as a React component. It renders one `<canvas>` that the effect fills, so
 * give it a width and a height with `className` or `style`. It draws after mount, so it renders
 * as an empty canvas on a server, and it is removed cleanly on unmount.
 *
 * Side effects: mounts the effect on the canvas after render; destroys it on unmount or when
 * `name`, `mode` or `label` change.
 *
 * @param props - The effect, the flake form, the mode, a label, a class and a style.
 * @returns The canvas.
 */
export function SeasonalEffect(props: SeasonalEffectProps) {
  const { name, shape = "dendrite", mode = "loop", label, className, style } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const handle = useRef<EffectHandle | null>(null);
  // The form is read when the effect mounts; a later change goes through `setShape` below.
  const shapeNow = useRef(shape);
  shapeNow.current = shape;

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    handle.current = mountEffect(node, name, { mode, shape: shapeNow.current, label });
    return () => {
      handle.current?.destroy();
      handle.current = null;
    };
  }, [name, mode, label]);

  useEffect(() => {
    handle.current?.setShape(shape);
  }, [shape]);

  return (
    <canvas
      ref={canvas}
      className={className}
      style={style}
      role="img"
      aria-label={label ?? `${name} animation`}
    />
  );
}
