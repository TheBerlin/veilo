// panel.tsx: the control panel beside the stage, with the Loader, Reveal and Export tabs.

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@veilo/ui";
import type { SettingsStore } from "../state/settings-store.ts";
import { ColorFields } from "./color-fields.tsx";
import { ControlGroups } from "./control-groups.tsx";
import { ExportTab } from "./export-tab.tsx";
import { LOADER_GROUPS, REVEAL_GROUPS } from "./controls.ts";
import styles from "./panel.module.css";

/** Props of {@link Panel}. */
export interface PanelProps {
  /** The settings store the controls read and write. */
  store: SettingsStore;
}

/**
 * The control panel. Side effects: writes settings to the store as controls change.
 *
 * @param props - The settings store.
 * @returns The panel.
 */
export function Panel(props: PanelProps) {
  return (
    <aside className={styles.panel} aria-label="Settings">
      <Tabs defaultValue="loader">
        <TabsList aria-label="Settings sections">
          <TabsTrigger value="loader">Loader</TabsTrigger>
          <TabsTrigger value="reveal">Reveal</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>
        <TabsContent value="loader" className={styles.content}>
          <ControlGroups store={props.store} groups={LOADER_GROUPS} />
          <ColorFields store={props.store} />
        </TabsContent>
        <TabsContent value="reveal" className={styles.content}>
          <ControlGroups store={props.store} groups={REVEAL_GROUPS} />
        </TabsContent>
        <TabsContent value="export" className={styles.content}>
          <ExportTab store={props.store} />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
