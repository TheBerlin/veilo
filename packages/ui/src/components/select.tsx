// select.tsx: a labelled native select for choosing one option from a list.

import { useId } from "react";
import field from "./field.module.css";
import styles from "./select.module.css";

/** One option of a {@link Select}. */
export interface SelectOption {
  /** The value reported when chosen. */
  value: string;
  /** The text shown. */
  label: string;
}

/** Props of {@link Select}. */
export interface SelectProps {
  /** The visible label, which also names the select for screen readers. */
  label: string;
  /** The chosen option's value. */
  value: string;
  /** Called with the newly chosen value. */
  onValueChange: (value: string) => void;
  /** The options, in order. */
  options: readonly SelectOption[];
  /** Disables the select. */
  disabled?: boolean;
  /** Extra class for the field. */
  className?: string;
}

/**
 * A labelled native `<select>`. It keeps the platform's own list, keyboard and touch behavior.
 *
 * @param props - The label, value, options and change handler.
 * @returns The field with label and select.
 */
export function Select(props: SelectProps) {
  const { label, value, onValueChange, options, disabled, className } = props;
  const id = useId();
  return (
    <div className={[field.field, className].filter(Boolean).join(" ")}>
      <label className={field.label} htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className={styles.select}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
