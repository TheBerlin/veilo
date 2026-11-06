// control-groups.tsx: renders a tab's control table: sliders, chips and selects bound to the
// settings store, with the controls that do not apply hidden.

import { ChipGroup, ChipGroupItem, Select, Slider } from "@veilo/ui";
import { useStore } from "zustand";
import { useSetting, type SettingsStore } from "../state/settings-store.ts";
import styles from "./panel.module.css";
import {
  boundsOf,
  optionsOf,
  type ChoiceControl,
  type ControlGroup,
  type NumberControl,
} from "./controls.ts";

/** Props of one field: the store and its control. */
interface FieldProps<C> {
  store: SettingsStore;
  control: C;
}

/** Most options shown as chips; longer lists use a select. */
const MAX_CHIPS = 4;

/** Props of {@link ControlGroups}. */
export interface ControlGroupsProps {
  /** The settings store the controls read and write. */
  store: SettingsStore;
  /** The tab's groups. */
  groups: readonly ControlGroup[];
}

/**
 * A tab's groups of controls. A control whose `shown` rule fails is not rendered, and a group
 * with no visible controls is left out entirely (spec 1.3).
 *
 * @param props - The store and the groups.
 * @returns The groups.
 */
export function ControlGroups(props: ControlGroupsProps) {
  const { store } = props;
  const settings = useStore(store, (state) => state.settings);
  return (
    <>
      {props.groups.map((group) => {
        const visible = group.controls.filter((control) => control.shown?.(settings) ?? true);
        if (visible.length === 0) return null;
        return (
          <fieldset key={group.title} className={styles.group}>
            <legend className={styles.legend}>{group.title}</legend>
            {visible.map((control) =>
              control.kind === "number" ? (
                <NumberField key={control.key} store={store} control={control} />
              ) : (
                <ChoiceField key={control.key} store={store} control={control} />
              ),
            )}
          </fieldset>
        );
      })}
    </>
  );
}

/**
 * A slider for one number setting.
 *
 * @param props - The store and the control.
 * @returns The slider.
 */
function NumberField(props: FieldProps<NumberControl>) {
  const { store, control } = props;
  const value = useSetting(store, control.key);
  const { min, max } = boundsOf(control.key);
  return (
    <Slider
      label={control.label}
      value={value}
      min={min}
      max={max}
      step={control.step}
      formatValue={control.format}
      onValueChange={(next) => store.getState().set(control.key, next)}
    />
  );
}

/**
 * Chips or a select for one choice setting.
 *
 * @param props - The store and the control.
 * @returns The chips or the select.
 */
function ChoiceField(props: FieldProps<ChoiceControl>) {
  const { store, control } = props;
  const value = useSetting(store, control.key);
  const options = optionsOf(control.key);
  const onValueChange = (next: string) => store.getState().set(control.key, next as never);
  const name = (option: string) => control.names[option] ?? option;

  if (options.length > MAX_CHIPS) {
    return (
      <Select
        label={control.label}
        value={value}
        onValueChange={onValueChange}
        options={options.map((option) => ({ value: option, label: name(option) }))}
      />
    );
  }
  return (
    <div className={styles.choice}>
      <span className={styles.choiceLabel}>{control.label}</span>
      <ChipGroup aria-label={control.label} value={value} onValueChange={onValueChange}>
        {options.map((option) => (
          <ChipGroupItem key={option} value={option}>
            {name(option)}
          </ChipGroupItem>
        ))}
      </ChipGroup>
    </div>
  );
}
