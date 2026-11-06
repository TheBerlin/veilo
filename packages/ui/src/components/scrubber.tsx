// scrubber.tsx: the full-width progress control of the transport bar, on Radix Slider.

import * as SliderPrimitive from "@radix-ui/react-slider";
import styles from "./slider.module.css";

/** Progress resolution: 1000 steps from 0 to 1. */
const STEP = 0.001;

/** Props of {@link Scrubber}. */
export interface ScrubberProps {
  /** Progress from 0 to 1. */
  value: number;
  /** Called with each new progress while dragging or on a key press. */
  onValueChange: (progress: number) => void;
  /** Called once with the final progress when dragging ends or after a key press. */
  onValueCommit?: (progress: number) => void;
  /** Names the control for screen readers. Defaults to "Progress". */
  "aria-label"?: string;
  /** Disables the scrubber. */
  disabled?: boolean;
  /** Extra class for the control. */
  className?: string;
}

/**
 * A full-width track that shows and sets progress from 0 to 1. Screen readers hear the value as
 * a percentage. Arrow keys move by 0.1%, Page Up and Down by 1%, Home and End jump to the ends.
 *
 * @param props - The progress, its change handlers and a label.
 * @returns The slider element.
 */
export function Scrubber(props: ScrubberProps) {
  const { value, onValueChange, onValueCommit, disabled, className } = props;
  const label = props["aria-label"] ?? "Progress";
  return (
    <SliderPrimitive.Root
      className={[styles.root, className].filter(Boolean).join(" ")}
      value={[value]}
      onValueChange={([next]) => {
        if (next !== undefined) onValueChange(next);
      }}
      onValueCommit={([next]) => {
        if (next !== undefined) onValueCommit?.(next);
      }}
      min={0}
      max={1}
      step={STEP}
      disabled={disabled}
    >
      <SliderPrimitive.Track className={styles.track}>
        <SliderPrimitive.Range className={styles.range} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={styles.thumb}
        aria-label={label}
        aria-valuetext={`${Math.round(value * 100)}%`}
      />
    </SliderPrimitive.Root>
  );
}
