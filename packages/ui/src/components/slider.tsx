// slider.tsx: a labelled range control for one number, on Radix Slider. Also the Scrubber.

import * as SliderPrimitive from "@radix-ui/react-slider";
import { useId, type ReactNode } from "react";
import field from "./field.module.css";
import styles from "./slider.module.css";

/** Props of {@link Slider}. */
export interface SliderProps {
  /** The visible label, which also names the thumb for screen readers. */
  label: string;
  /** The current value. */
  value: number;
  /** Called with each new value while dragging or on a key press. */
  onValueChange: (value: number) => void;
  /** Lowest value. */
  min: number;
  /** Highest value. */
  max: number;
  /** Distance between allowed values. */
  step: number;
  /** Turns the value into the text shown next to the label and read by screen readers. */
  formatValue?: (value: number) => string;
  /** Text under the start of the track, such as "0.5x". */
  startLabel?: ReactNode;
  /** Text under the end of the track, such as "2x". */
  endLabel?: ReactNode;
  /** Disables the slider. */
  disabled?: boolean;
  /** Extra class for the field. */
  className?: string;
}

/**
 * A labelled slider for one number, with the current value beside the label and optional end
 * labels. Arrow keys step, Page Up and Down take ten steps, Home and End jump to the ends.
 *
 * @param props - The label, value, range, step and change handler.
 * @returns The field with label, track and thumb.
 */
export function Slider(props: SliderProps) {
  const { label, value, onValueChange, min, max, step, formatValue = String } = props;
  const { startLabel, endLabel, disabled, className } = props;
  const labelId = useId();
  const text = formatValue(value);
  return (
    <div className={[field.field, className].filter(Boolean).join(" ")}>
      <span className={field.label}>
        <span id={labelId}>{label}</span>
        <span className={field.value} aria-hidden="true">
          {text}
        </span>
      </span>
      <SliderPrimitive.Root
        className={styles.root}
        value={[value]}
        // One thumb, so the first value is the value.
        onValueChange={([next]) => {
          if (next !== undefined) onValueChange(next);
        }}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      >
        <SliderPrimitive.Track className={styles.track}>
          <SliderPrimitive.Range className={styles.range} />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={styles.thumb}
          aria-labelledby={labelId}
          aria-valuetext={text}
        />
      </SliderPrimitive.Root>
      {startLabel !== undefined || endLabel !== undefined ? (
        <span className={field.hint} aria-hidden="true">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </span>
      ) : null}
    </div>
  );
}
