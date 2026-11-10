// main.tsx: the component preview page. Every component once, in the theme chosen at the top.

import "../tokens.css";
import { StrictMode, useEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Chip,
  ChipGroup,
  ChipGroupItem,
  CodeBlock,
  ColorField,
  Scrubber,
  Select,
  Slider,
  CurveEditor,
  Grid,
  GridCell,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toggle,
  Tooltip,
  TooltipProvider,
} from "../src/index.ts";
import type { CurveValue } from "../src/index.ts";
import styles from "./preview.module.css";

/** A plus glyph for the icon buttons. */
const plus = (
  <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/**
 * One labelled card of the page.
 *
 * @param props - The heading and the components to show.
 * @returns The section.
 */
function Section(props: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{props.title}</h2>
      {props.children}
    </section>
  );
}

/**
 * The page. The theme comes from `?theme=light` or the toggle, so screenshots can pick one.
 *
 * @returns Every component in its usual states.
 */
function Preview() {
  const [light, setLight] = useState(new URLSearchParams(location.search).get("theme") === "light");
  const [effect, setEffect] = useState("shimmer");
  const [loop, setLoop] = useState(true);
  const [curve, setCurve] = useState<CurveValue>([0.22, 1, 0.36, 1]);
  const [chip, setChip] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0.4);
  const [origin, setOrigin] = useState("left");
  const [color, setColor] = useState("#dcdcdc");

  useEffect(() => {
    document.documentElement.dataset.theme = light ? "light" : "dark";
  }, [light]);

  return (
    <TooltipProvider delayDuration={200}>
      <main className={styles.page}>
        <div className={styles.column}>
          <header className={styles.header}>
            <h1 className={styles.title}>Veilo components</h1>
            <Toggle label="Light theme" checked={light} onCheckedChange={setLight} />
          </header>

          <Section title="Button">
            <div className={styles.row}>
              <Button variant="primary">Open Playground</Button>
              <Button>Browse gallery</Button>
              <Button variant="ghost">Docs</Button>
              <Button disabled>Disabled</Button>
            </div>
            <div className={styles.row}>
              <Button size="sm" icon={plus}>
                Small
              </Button>
              <Button icon={plus}>Medium</Button>
              <Button size="lg" variant="primary" icon={plus}>
                Large
              </Button>
              <Button iconOnly aria-label="Add, small" size="sm" icon={plus} />
              <Button iconOnly aria-label="Add" icon={plus} />
              <Button iconOnly aria-label="Add, large" size="lg" icon={plus} />
            </div>
          </Section>

          <Section title="Chip and Toggle">
            <div className={styles.row}>
              <ChipGroup aria-label="Effect" value={effect} onValueChange={setEffect}>
                <ChipGroupItem value="shimmer">Shimmer</ChipGroupItem>
                <ChipGroupItem value="wave">Wave</ChipGroupItem>
                <ChipGroupItem value="pulse">Pulse</ChipGroupItem>
              </ChipGroup>
              <ChipGroup
                aria-label="Effect, segmented"
                value={effect}
                onValueChange={setEffect}
                variant="segmented"
              >
                <ChipGroupItem value="shimmer">Shimmer</ChipGroupItem>
                <ChipGroupItem value="wave">Wave</ChipGroupItem>
                <ChipGroupItem value="pulse">Pulse</ChipGroupItem>
              </ChipGroup>
              <Chip pressed={chip} onPressedChange={setChip}>
                Toggle chip
              </Chip>
              <Toggle label="Loop" checked={loop} onCheckedChange={setLoop} />
              <Toggle label="Disabled" checked={false} onCheckedChange={() => {}} disabled />
            </div>
          </Section>

          <Section title="Tabs">
            <Tabs defaultValue="loader">
              <TabsList aria-label="Sections">
                <TabsTrigger value="loader">Loader</TabsTrigger>
                <TabsTrigger value="reveal">Reveal</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>
              <TabsContent value="loader">Loader settings</TabsContent>
              <TabsContent value="reveal">Reveal settings</TabsContent>
              <TabsContent value="export">Export code</TabsContent>
            </Tabs>
          </Section>

          <Section title="Slider, Select and Color field">
            <div className={styles.fields}>
              <Slider
                label="Speed"
                value={speed}
                onValueChange={setSpeed}
                min={0.5}
                max={2}
                step={0.1}
                formatValue={(v) => `${v.toFixed(1)}x`}
                startLabel="0.5x"
                endLabel="2x"
              />
              <Select
                label="Origin"
                value={origin}
                onValueChange={setOrigin}
                options={[
                  { value: "left", label: "Left" },
                  { value: "center", label: "Center" },
                  { value: "random", label: "Random" },
                ]}
              />
              <ColorField label="Base color" value={color} onValueChange={setColor} />
              <CurveEditor label="Easing curve" value={curve} onValueChange={setCurve} />
            </div>
          </Section>

          <Section title="Scrubber and Tooltip">
            <Scrubber value={progress} onValueChange={setProgress} />
            <div className={styles.row}>
              <Tooltip content="Replay the reveal">
                <Button iconOnly aria-label="Replay" icon={plus} />
              </Tooltip>
              <span>Hover or focus the button for its tooltip.</span>
            </div>
          </Section>

          <Section title="Code block">
            <CodeBlock code="pnpm add @veilo/css" prompt aria-label="Install command" />
            <CodeBlock
              code={
                ".skeleton {\n  border-radius: 6px;\n  animation: veilo-sweep 1.4s infinite;\n}"
              }
              aria-label="Loader CSS"
            />
          </Section>
        </div>

        {/* The page grid needs the full width to show its margins, so it sits outside the
            column. Resize the window across 900 px to see it switch from 12 to 4 columns. */}
        <section className={styles.gridDemo} aria-labelledby="grid-heading">
          <h2 id="grid-heading" className={[styles.heading, styles.gridHeading].join(" ")}>
            Grid (12 columns above 900 px, 4 at 900 px and below)
          </h2>
          <Grid rowGap="space-2">
            {Array.from({ length: 12 }, (_, i) => (
              <GridCell key={i} span={1} spanMobile={1} className={styles.gridCell}>
                {i + 1}
              </GridCell>
            ))}
            <GridCell span={6} className={styles.gridCell}>
              Hero text, 6
            </GridCell>
            <GridCell span={6} className={styles.gridCell}>
              Hero art, 6
            </GridCell>
            <GridCell span={4} className={styles.gridCell}>
              How it works text, 4
            </GridCell>
            <GridCell span={7} start={6} className={styles.gridCell}>
              Video, 7 (one empty column before)
            </GridCell>
            {[1, 2, 3, 4].map((n) => (
              <GridCell key={n} span={3} spanMobile={2} className={styles.gridCell}>
                Tile {n}, 3 (2 on mobile)
              </GridCell>
            ))}
          </Grid>
        </section>
      </main>
    </TooltipProvider>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Preview />
    </StrictMode>,
  );
}
