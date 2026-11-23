// presets-tab.tsx: the Presets tab: save the current settings under a name; apply, rename,
// update or delete saved presets; export and import them as a file. Every action answers with a
// toast at the top centre, like Reset to defaults; Delete, Update and Import offer Undo in it.

import { Button, TextField, toast, toastCountdown } from "@veilo-ui/ui";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useStore } from "zustand";
import styles from "../panel/panel.module.css";
import type { SettingsStore } from "../state/settings-store.ts";
import {
  downloadText,
  presetsFileName,
  importMessage,
  mergePresets,
  PRESETS_FILE_ERRORS,
  PRESETS_FILE_LIMITS,
  presetsFileText,
  readPresetsFile,
} from "./presets-file.ts";
import tab from "./presets-tab.module.css";
import { NAME_ERRORS, NAME_MAX, nameError, sameSettings, type UserPreset } from "./user-presets.ts";
import type { UserPresetsStore } from "./user-presets-store.ts";

/** Shown when the browser keeps no data for the page. */
export const NOT_KEPT =
  "This browser is not keeping data for this page, so saved presets last only until you close it.";

/** Shown while the list is empty. */
export const EMPTY_LIST = "No saved presets yet. They stay in this browser.";

/** The id shared by this tab's messages, so a new one replaces the one on screen. */
const MESSAGE_ID = "my-presets";

/** How long a plain message stays, in milliseconds. */
const MESSAGE_MS = 4000;

/** How long a message that offers Undo stays, in milliseconds. */
export const UNDO_MESSAGE_MS = 10_000;

/** The id of the Import file button, where focus goes when the list has no row left. */
const IMPORT_ID = "presets-import";

/** Props of {@link PresetsTab}. */
export interface PresetsTabProps {
  /** The settings store: saved from, and applied to. */
  store: SettingsStore;
  /** The saved presets. */
  presets: UserPresetsStore;
}

/**
 * The Presets tab. Side effects: writes the presets store (which saves to storage) and, on
 * Apply, loads a preset's settings into the settings store, which plays the full sequence.
 *
 * @param props - The settings store and the presets store.
 * @returns The tab's sections.
 */
export function PresetsTab(props: PresetsTabProps) {
  const { store, presets: presetsStore } = props;
  const settings = useStore(store, (state) => state.settings);
  const presets = useStore(presetsStore, (state) => state.presets);
  const persistent = useStore(presetsStore, (state) => state.persistent);

  // The rows there were when the tab opened: only rows added later (saved, imported, restored by
  // Undo) slide in, so opening the tab does not animate the whole list.
  const [initialIds] = useState(() => new Set(presetsStore.getState().presets.map((p) => p.id)));
  const [name, setName] = useState("");
  // The empty-name message waits for a save attempt; a taken name shows while typing.
  const [tried, setTried] = useState(false);
  const [editing, setEditing] = useState<{ id: string; draft: string; tried: boolean } | null>(
    null,
  );
  const fileInput = useRef<HTMLInputElement>(null);
  // Where focus goes after the row it was in changes (a finished rename, a delete).
  const [focusTarget, setFocusTarget] = useState<string | null>(null);

  useEffect(() => {
    if (focusTarget === null) return;
    document.getElementById(focusTarget)?.focus();
    setFocusTarget(null);
  }, [focusTarget]);

  const actions = presetsStore.getState();
  const saveError = nameError(name, presets);

  /**
   * Shows a message as a toast. With `before`, the toast offers Undo, which puts that list back,
   * and stays longer. Every message shows the time left on a line along its bottom edge, as Reset to
   * defaults does.
   *
   * @param text - The message.
   * @param before - The list before the action, when it can be undone.
   */
  const say = (text: string, before?: UserPreset[]) => {
    const ms = before ? UNDO_MESSAGE_MS : MESSAGE_MS;
    toast(text, {
      id: MESSAGE_ID,
      duration: ms,
      ...toastCountdown(ms),
      action: before
        ? {
            label: "Undo",
            onClick: () => {
              actions.replaceAll(before);
              toast("Undone.", {
                id: MESSAGE_ID,
                duration: MESSAGE_MS,
                ...toastCountdown(MESSAGE_MS),
              });
            },
          }
        : undefined,
    });
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    setTried(true);
    if (saveError) return;
    const preset = actions.add(name, store.getState().settings);
    setName("");
    setTried(false);
    say(`Saved “${preset.name}”.`);
  };

  const apply = (preset: UserPreset) => {
    store.getState().load(preset.settings);
    say(`Applied “${preset.name}”.`);
  };

  const update = (preset: UserPreset) => {
    const before = presets;
    actions.update(preset.id, store.getState().settings);
    say(`Updated “${preset.name}” with the current settings.`, before);
  };

  const remove = (preset: UserPreset) => {
    const before = presets;
    actions.remove(preset.id);
    say(`Deleted “${preset.name}”.`, before);
    const next = presets.find((item) => item.id !== preset.id);
    setFocusTarget(next ? renameId(next) : IMPORT_ID);
  };

  const finishRename = (event: FormEvent, preset: UserPreset) => {
    event.preventDefault();
    if (!editing) return;
    const error = nameError(editing.draft, presets, preset.id);
    if (error) {
      setEditing({ ...editing, tried: true });
      return;
    }
    actions.rename(preset.id, editing.draft);
    setEditing(null);
    say(`Renamed to “${editing.draft.trim()}”.`);
    setFocusTarget(renameId(preset));
  };

  const cancelRename = (preset: UserPreset) => {
    setEditing(null);
    setFocusTarget(renameId(preset));
  };

  const exportFile = () => {
    const fileName = presetsFileName(presets);
    downloadText(presetsFileText(presets), fileName);
    const count = `${presets.length} ${presets.length === 1 ? "preset" : "presets"}`;
    say(`Exported ${count} to ${fileName}.`);
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    // Cleared, so choosing the same file again still fires a change.
    input.value = "";
    if (!file) return;
    if (file.size > PRESETS_FILE_LIMITS.bytes) {
      say(PRESETS_FILE_ERRORS.large);
      return;
    }
    const result = readPresetsFile(await file.text());
    if (!result.ok) {
      say(PRESETS_FILE_ERRORS[result.error]);
      return;
    }
    // Read after the await: the list may have changed while the file was read.
    const before = presetsStore.getState().presets;
    actions.replaceAll(mergePresets(before, result.entries));
    say(importMessage(result.entries.length, result.skipped), before);
  };

  return (
    <>
      <section className={styles.group}>
        <h3 className={styles.legend}>Save current settings</h3>
        <form className={tab.form} onSubmit={save} noValidate>
          <TextField
            label="Preset name"
            value={name}
            onValueChange={setName}
            maxLength={NAME_MAX}
            error={visibleError(saveError, tried)}
            hint={`Up to ${NAME_MAX} characters.`}
          />
          <Button type="submit" size="sm" variant="primary">
            Save
          </Button>
        </form>
      </section>

      <section className={styles.group}>
        <h3 className={styles.legend}>My presets</h3>
        {persistent ? null : <p className={styles.message}>{NOT_KEPT}</p>}
        {presets.length === 0 ? (
          <p className={styles.message}>{EMPTY_LIST}</p>
        ) : (
          <ul className={tab.list} aria-label="My presets">
            {presets.map((preset) => {
              const inUse = sameSettings(preset.settings, settings);
              const renaming = editing?.id === preset.id;
              const renameError = renaming ? nameError(editing.draft, presets, preset.id) : "";
              return (
                <li
                  key={preset.id}
                  className={initialIds.has(preset.id) ? tab.row : `${tab.row} ${tab.rowNew}`}
                >
                  {renaming ? (
                    <form
                      className={tab.form}
                      onSubmit={(event) => finishRename(event, preset)}
                      noValidate
                    >
                      <TextField
                        label={`New name for “${preset.name}”`}
                        value={editing.draft}
                        onValueChange={(draft) => setEditing({ ...editing, draft })}
                        maxLength={NAME_MAX}
                        error={visibleError(renameError, editing.tried)}
                        autoFocus
                        onKeyDown={(event) => {
                          if (event.key === "Escape") cancelRename(preset);
                        }}
                      />
                      <div className={tab.actions}>
                        <Button type="submit" size="sm" variant="primary">
                          Save name
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => cancelRename(preset)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <span className={tab.name}>
                        {preset.name}
                        {inUse ? <span className={tab.inUse}>In use</span> : null}
                      </span>
                      <div className={tab.actions}>
                        <Button
                          size="sm"
                          onClick={() => apply(preset)}
                          aria-label={`Apply ${preset.name}`}
                        >
                          Apply
                        </Button>
                        <Button
                          id={renameId(preset)}
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setEditing({ id: preset.id, draft: preset.name, tried: false })
                          }
                          aria-label={`Rename ${preset.name}`}
                        >
                          Rename
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => update(preset)}
                          disabled={inUse}
                          aria-label={`Update ${preset.name} with the current settings`}
                        >
                          Update
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => remove(preset)}
                          aria-label={`Delete ${preset.name}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={styles.group}>
        <h3 className={styles.legend}>File</h3>
        <p className={styles.message}>
          Move presets to another browser, or share a set, as a JSON file named after the preset.
        </p>
        <div className={tab.actions}>
          <Button size="sm" onClick={exportFile} disabled={presets.length === 0}>
            Export file
          </Button>
          <Button id={IMPORT_ID} size="sm" onClick={() => fileInput.current?.click()}>
            Import file
          </Button>
          {/* The native picker, opened by Import file; hidden, as the button names it. */}
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(event) => void importFile(event)}
          />
        </div>
      </section>
    </>
  );
}

/**
 * Which name error to show now. A taken or too long name shows while typing; an empty name only
 * after a save attempt, so an untouched box is not red.
 *
 * @param error - The name's error, or `""`.
 * @param tried - Whether the user tried to save.
 * @returns The message to show, or `undefined` for none.
 */
function visibleError(error: string, tried: boolean): string | undefined {
  if (error === "") return undefined;
  return tried || error !== NAME_ERRORS.empty ? error : undefined;
}

/**
 * The id of a row's Rename button, so focus can return to it after a rename.
 *
 * @param preset - The row's preset.
 * @returns The element id.
 */
function renameId(preset: UserPreset): string {
  return `rename-${preset.id}`;
}
