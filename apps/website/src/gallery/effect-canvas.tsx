// effect-canvas.tsx: the canvas of one winter effect. It starts once the tile has been scrolled
// near, mounts the effect from @veilo-ui/seasonal in hover mode, and keeps the flake form in step.

import { mountEffect, type EffectHandle, type EffectId, type FlakeShape } from "@veilo-ui/seasonal";
import { useCallback, useEffect, useRef } from "react";
import { useSeen } from "../home/use-seen.ts";

/** Props of {@link EffectCanvas}. */
export interface EffectCanvasProps {
  /** The effect to draw. */
  id: EffectId;
  /** The flake form, for the effects that draw a flake. */
  shape: FlakeShape;
  /** The accessible name: what it shows and how to play it. */
  label: string;
  /** Class for the canvas. */
  className?: string;
}

/**
 * A canvas that draws a winter effect: a still frame at rest, a full run on hover, press or
 * Enter. Hover and press are taken from the whole card (the nearest `article`).
 *
 * Side effects: mounts the effect once the canvas has been scrolled into view; destroys it on
 * unmount or when the effect changes.
 *
 * @param props - The effect, the flake form, the accessible name and a class.
 * @returns The canvas.
 */
export function EffectCanvas(props: EffectCanvasProps) {
  const { id, shape, label, className } = props;
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const handle = useRef<EffectHandle | null>(null);
  const shapeNow = useRef(shape);
  shapeNow.current = shape;
  const { ref: seenRef, seen } = useSeen<HTMLCanvasElement>();
  const setCanvas = useCallback(
    (node: HTMLCanvasElement | null) => {
      canvas.current = node;
      seenRef(node);
    },
    [seenRef],
  );

  useEffect(() => {
    const node = canvas.current;
    if (!seen || !node) return;
    // The package reads the visitor's motion preference, follows theme changes by itself, and
    // redraws once the fonts have loaded.
    handle.current = mountEffect(node, id, {
      mode: "hover",
      shape: shapeNow.current,
      host: node.closest<HTMLElement>("article") ?? undefined,
    });
    return () => {
      handle.current?.destroy();
      handle.current = null;
    };
  }, [seen, id]);

  useEffect(() => {
    handle.current?.setShape(shape);
  }, [shape]);

  return (
    <canvas ref={setCanvas} className={className} role="img" tabIndex={0} aria-label={label} />
  );
}
