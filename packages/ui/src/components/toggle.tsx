// toggle.tsx: an on/off switch with a visible label, built on Radix Switch.

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { useId } from "react";
import styles from "./toggle.module.css";

/** Props of {@link Toggle}. */
export interface ToggleProps {
  /** The visible label, which also names the switch for screen readers. */
  label: string;
  /** Whether the switch is on. */
  checked: boolean;
  /** Called with the new state. */
  onCheckedChange: (checked: boolean) => void;
  /** Disables the switch. */
  disabled?: boolean;
  /** Extra class for the row. */
  className?: string;
}

/**
 * An on/off switch with its label. It has the `switch` role and toggles with Space, or with a
 * click on the switch or the label.
 *
 * @param props - The label, the state and its change handler.
 * @returns The labelled switch.
 */
export function Toggle(props: ToggleProps) {
  const { label, checked, onCheckedChange, disabled, className } = props;
  const id = useId();
  return (
    <span className={[styles.field, className].filter(Boolean).join(" ")}>
      <SwitchPrimitive.Root
        id={id}
        className={styles.switch}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      >
        <SwitchPrimitive.Thumb className={styles.thumb} />
      </SwitchPrimitive.Root>
      <label htmlFor={id}>{label}</label>
    </span>
  );
}
