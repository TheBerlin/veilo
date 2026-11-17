// code-section.tsx: the Export tab's Code section: a format select and one code block that shows
// the chosen format for the current settings and card.

import { CodeBlock, Select } from "@veilo/ui";
import { useState } from "react";
import {
  CODE_FORMATS,
  codeFor,
  DEFAULT_CODE_FORMAT,
  type CodeFormatId,
} from "../export/code-formats.ts";
import type { Content } from "../state/content-store.ts";
import type { Settings } from "@veilo/core";
import { themeColor } from "./color-fields.tsx";
import styles from "./panel.module.css";

/** The select's options, in the table's order. */
const OPTIONS = CODE_FORMATS.map((format) => ({ value: format.id, label: format.label }));

/** Props of {@link CodeSection}. */
export interface CodeSectionProps {
  /** The current settings. */
  settings: Settings;
  /** The current preview content, for the snippets. */
  content: Content;
}

/**
 * The Code section. Reads the theme's loader colors from the page when it renders, so the CSS
 * has hex values. The chosen format is kept in the component and not saved.
 *
 * @param props - The settings and content to write code for.
 * @returns The section.
 */
export function CodeSection(props: CodeSectionProps) {
  const [formatId, setFormatId] = useState<CodeFormatId>(DEFAULT_CODE_FORMAT);
  const format = CODE_FORMATS.find((item) => item.id === formatId) ?? CODE_FORMATS[0]!;
  const code = codeFor(format.id, {
    settings: props.settings,
    content: props.content,
    base: themeColor("--veilo-base"),
    highlight: themeColor("--veilo-hi"),
  });
  return (
    <section className={styles.group}>
      <h3 className={styles.legend}>Code</h3>
      <Select
        label="Format"
        value={format.id}
        options={OPTIONS}
        onValueChange={(value) => {
          const next = CODE_FORMATS.find((item) => item.id === value);
          if (next) setFormatId(next.id);
        }}
      />
      <CodeBlock code={code} aria-label={format.label} />
      <p className={styles.message}>
        {format.usesPackage
          ? "The @veilo packages are not on npm yet, so this code runs once they are published."
          : "Copy this code, or read the other formats from the list above."}
      </p>
    </section>
  );
}
