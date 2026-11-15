// presets-tab.tsx: the Presets tab: save the current settings under a name; apply, rename,
// update or delete saved presets; export and import them as a file. Delete, Update and Import
// offer Undo until the next action here.

import { Button, TextField } from "@veilo/ui";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useStore } from "zustand";
import styles from "../panel/panel.module.css";
import type { SettingsStore } from "../state/settings-store.ts";
import {
  downloadText,
  importMessage,
  mergePresets,
  PRESETS_FILE_ERRORS,
  PRESETS_FILE_LIMITS,
  PRESETS_FILE_NAME,
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

/** The result of the last action, and what Undo puts back. */
interface Notice {
  /** The message. */
  text: string;
  /** The list before the action, when it can be undone. */
  undo?: UserPreset[];
  /** The section whose result line shows it. Defaults to the list. */
  place?: NoticePlace;
}

/** Where a notice shows: under the My presets heading, or in the File section. */
type NoticePlace = "list" | "file";

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

  const [name, setName] = useState("");
  // The empty-name message waits for a save attempt; a taken name shows while typing.
  const [tried, setTried] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [editing, setEditing] = useState<{ id: string; draft: string; tried: boolean } | null>(
    null,
  );
  const undoRef = useRef<HTMLButtonElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  // Where focus goes after the row it was in changes (a finished rename, a delete).
  const [focusTarget, setFocusTarget] = useState<string | null>(null);

  useEffect(() => {
    if (focusTarget === null) return;
    if (focusTarget === "undo") undoRef.current?.focus();
    else document.getElementById(focusTarget)?.focus();
    setFocusTarget(null);
  }, [focusTarget]);

  const actions = presetsStore.getState();
  const saveError = nameError(name, presets);

  const save = (event: FormEvent) => {
    event.preventDefault();
    setTried(true);
    if (saveError) return;
    const preset = actions.add(name, store.getState().settings);
    setName("");
    setTried(false);
    setNotice({ text: `Saved “${preset.name}”.` });
  };

  const apply = (preset: UserPreset) => {
    store.getState().load(preset.settings);
    setNotice({ text: `Applied “${preset.name}”.` });
  };

  const update = (preset: UserPreset) => {
    const before = presets;
    actions.update(preset.id, store.getState().settings);
    setNotice({ text: `Updated “${preset.name}” with the current settings.`, undo: before });
  };

  const remove = (preset: UserPreset) => {
    const before = presets;
    actions.remove(preset.id);
    setNotice({ text: `Deleted “${preset.name}”.`, undo: before });
    setFocusTarget("undo");
  };

  const undo = () => {
    if (!notice?.undo) return;
    actions.replaceAll(notice.undo);
    setNotice({ text: "Undone.", place: notice.place });
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
    setNotice({ text: `Renamed to “${editing.draft.trim()}”.` });
    setFocusTarget(renameId(preset));
  };

  const cancelRename = (preset: UserPreset) => {
    setEditing(null);
    setFocusTarget(renameId(preset));
  };

  const exportFile = () => {
    downloadText(presetsFileText(presets), PRESETS_FILE_NAME);
    const count = `${presets.length} ${presets.length === 1 ? "preset" : "presets"}`;
    setNotice({ text: `Exported ${count} to ${PRESETS_FILE_NAME}.`, place: "file" });
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    // Cleared, so choosing the same file again still fires a change.
    input.value = "";
    if (!file) return;
    if (file.size > PRESETS_FILE_LIMITS.bytes) {
      setNotice({ text: PRESETS_FILE_ERRORS.large, place: "file" });
      return;
    }
    const result = readPresetsFile(await file.text());
    if (!result.ok) {
      setNotice({ text: PRESETS_FILE_ERRORS[result.error], place: "file" });
      return;
    }
    // Read after the await: the list may have changed while the file was read.
    const before = presetsStore.getState().presets;
    actions.replaceAll(mergePresets(before, result.entries));
    setNotice({
      text: importMessage(result.entries.length, result.skipped),
      undo: before,
      place: "file",
    });
  };

  /**
   * The result line of one section. Both lines are always rendered (a live region that appears
   * with its text is often not read out); the notice shows in the section it belongs to.
   *
   * @param place - The section.
   * @returns The polite live region.
   */
  const noticeLine = (place: NoticePlace) => {
    const shown = notice && (notice.place ?? "list") === place ? notice : null;
    return (
      <p className={tab.notice} aria-live="polite">
        {shown?.text}
        {shown?.undo ? (
          <Button ref={undoRef} size="sm" variant="ghost" onClick={undo}>
            Undo
          </Button>
        ) : null}
      </p>
    );
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
        {noticeLine("list")}
        {presets.length === 0 ? (
          <p className={styles.message}>{EMPTY_LIST}</p>
        ) : (
          <ul className={tab.list} aria-label="My presets">
            {presets.map((preset) => {
              const inUse = sameSettings(preset.settings, settings);
              const renaming = editing?.id === preset.id;
              const renameError = renaming ? nameError(editing.draft, presets, preset.id) : "";
              return (
                <li key={preset.id} className={tab.row}>
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
          Move presets to another browser, or share a set, as {PRESETS_FILE_NAME}.
        </p>
        <div className={tab.actions}>
          <Button size="sm" onClick={exportFile} disabled={presets.length === 0}>
            Export file
          </Button>
          <Button size="sm" onClick={() => fileInput.current?.click()}>
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
        {noticeLine("file")}
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
