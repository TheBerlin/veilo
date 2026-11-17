// panel.tsx: the control panel beside the stage, with the Loader, Reveal, Content, Presets and
// Export tabs.

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@veilo/ui";
import { useState } from "react";
import { PresetsTab } from "../presets/presets-tab.tsx";
import type { UserPresetsStore } from "../presets/user-presets-store.ts";
import { createContentStore, type ContentStore } from "../state/content-store.ts";
import type { SettingsStore } from "../state/settings-store.ts";
import { ColorFields, InkColorField } from "./color-fields.tsx";
import { ContentTab } from "./content-tab.tsx";
import { ControlGroups } from "./control-groups.tsx";
import { ExportTab } from "./export-tab.tsx";
import { LOADER_GROUPS, REVEAL_GROUPS } from "./controls.ts";
import styles from "./panel.module.css";

/** Props of {@link Panel}. */
export interface PanelProps {
  /** The settings store the controls read and write. */
  store: SettingsStore;
  /** The user's saved presets, for the Presets tab. */
  presets: UserPresetsStore;
  /** The preview content, for the Export tab's share link. */
  content?: ContentStore;
}

/**
 * The control panel. Side effects: writes settings to the store as controls change, and saved
 * presets to their store from the Presets tab.
 *
 * @param props - The settings store and the saved presets.
 * @returns The panel.
 */
export function Panel(props: PanelProps) {
  // The app passes its store; tests that leave it out get a private one.
  const [content] = useState(() => props.content ?? createContentStore());
  return (
    <aside className={styles.panel} aria-label="Settings">
      <Tabs defaultValue="loader">
        {/* Stretched: five tabs fit on one row in the panel only this way. */}
        <TabsList aria-label="Settings sections" stretch>
          <TabsTrigger value="loader">Loader</TabsTrigger>
          <TabsTrigger value="reveal">Reveal</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>
        <TabsContent value="loader" className={styles.content}>
          <ControlGroups store={props.store} groups={LOADER_GROUPS} />
          <ColorFields store={props.store} />
        </TabsContent>
        <TabsContent value="reveal" className={styles.content}>
          <ControlGroups store={props.store} groups={REVEAL_GROUPS} />
          <InkColorField store={props.store} />
        </TabsContent>
        <TabsContent value="content" className={styles.content}>
          <ContentTab content={content} />
        </TabsContent>
        <TabsContent value="presets" className={styles.content}>
          <PresetsTab store={props.store} presets={props.presets} />
        </TabsContent>
        <TabsContent value="export" className={styles.content}>
          <ExportTab store={props.store} content={content} />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
