// demo-photo.tsx: a demo card's picture: a canvas drawn before the reveal exists.

import { useLayoutEffect, useRef } from "react";
import { drawScene, type SceneId } from "./demo-scenes.ts";

/** Props of {@link DemoPhoto}. */
export interface DemoPhotoProps {
  /** Which picture to draw. */
  scene: SceneId;
  /** Width divided by height. */
  ratio: number;
  /** The slot name the reveal finds this picture by. */
  slot: string;
  /** Class for size and corners. */
  className?: string;
}

/**
 * The picture of a demo card. It is drawn in a layout effect, which runs before the reveal
 * (created after the commit) samples its pixels.
 *
 * @param props - The scene, its ratio and its slot name.
 * @returns A canvas marked as the card's image slot and hidden from screen readers.
 */
export function DemoPhoto(props: DemoPhotoProps) {
  const { scene, ratio, slot, className } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    if (canvas.current) drawScene(canvas.current, scene, ratio);
  }, [scene, ratio]);
  return (
    <canvas
      ref={canvas}
      className={className}
      style={{ aspectRatio: String(ratio) }}
      data-veilo-slot={slot}
      aria-hidden="true"
    />
  );
}
