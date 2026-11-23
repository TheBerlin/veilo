// gallery-page.tsx: the gallery page: the winter effects as live tiles, in a section that names the
// season while it runs, with a flake-form switch, a sort, and a closing step into the Playground.
// A season ends by itself: out of season its effects join one plain "All effects" section.

import {
  Badge,
  Button,
  Card,
  ChipGroup,
  ChipGroupItem,
  Grid,
  GridCell,
  Select,
} from "@veilo-ui/ui";
import { FLAKE_SHAPES, usesFlakeShape, type FlakeShape } from "@veilo-ui/seasonal";
import { useMemo, useState, type ReactNode } from "react";
import { PLAYGROUND_URL } from "../site/links.ts";
import { EffectTile } from "./effect-tile.tsx";
import {
  EFFECTS,
  SEASONS,
  effectiveDate,
  labelPreview,
  labelsFor,
  sortEffects,
  splitBySeason,
  type GalleryEffect,
  type SortKey,
} from "./effects.ts";
import styles from "./gallery-page.module.css";
import { LATEST_RELEASE } from "./release.ts";
import { UseDrawer } from "./use-drawer.tsx";

/** The names of the flake forms, as shown on the switch. */
const SHAPE_NAMES: Record<FlakeShape, string> = {
  dendrite: "Dendrite",
  fern: "Fern",
  fir: "Fir",
  sector: "Sector",
};

/** The sort options. */
const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name" },
] as const;

/** Props of {@link GallerySection}. */
interface GallerySectionProps {
  /** The section's heading. */
  title: string;
  /** A badge beside the heading, for example the season. */
  badge?: string;
  /** One or two sentences under the heading. */
  copy: string;
  /** The effects of the section, already sorted. */
  effects: readonly GalleryEffect[];
  /** The current flake form. */
  shape: FlakeShape;
  /** Whether tiles repeat the season label (a section named for the season does not). */
  showSeason: boolean;
  /** The latest released version. */
  latest: string;
  /** The date that decides what is in season. */
  now: Date;
  /** Called when the visitor asks how to use an effect. */
  onUse: (effect: GalleryEffect) => void;
  /** The flake-form switch, shown in the header of the first section only. */
  shapeControl?: ReactNode;
  /** The count and sort row, shown above the tiles of the first section only. */
  toolbar?: ReactNode;
}

/**
 * One section of the gallery: a heading, its copy, optionally the switch and the toolbar, and its
 * tiles in a list, three to a row on a wide screen and one on a phone.
 *
 * @param props - The heading, copy, effects and the shared state.
 * @returns The section.
 */
function GallerySection(props: GallerySectionProps) {
  const {
    title,
    badge,
    copy,
    effects,
    shape,
    showSeason,
    latest,
    now,
    onUse,
    shapeControl,
    toolbar,
  } = props;
  const headingId = `section-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <Grid rowGap="space-4">
        <GridCell>
          <div className={styles.sectionHead}>
            <div className={styles.sectionText}>
              <div className={styles.sectionTitleRow}>
                <h2 id={headingId} className={styles.sectionTitle}>
                  {title}
                </h2>
                {badge ? <Badge>{badge}</Badge> : null}
              </div>
              <p className={styles.caption}>{copy}</p>
            </div>
            {shapeControl}
          </div>
        </GridCell>
        {toolbar ? <GridCell>{toolbar}</GridCell> : null}
      </Grid>
      <Grid as="ul" rowGap="space-4">
        {effects.map((effect) => (
          <GridCell key={effect.id} as="li" span={4} spanMobile={4}>
            <EffectTile
              effect={effect}
              shape={shape}
              labels={labelsFor(effect, { latest, now, showSeason })}
              onUse={onUse}
            />
          </GridCell>
        ))}
      </Grid>
    </section>
  );
}

/**
 * The gallery page. The one `h1` and its caption; then the effects in a season's section while
 * that season runs, and in "All effects" otherwise; then a closing step. The flake-form switch
 * changes every snowflake tile at once; the sort orders them.
 *
 * @returns The page's content, for the `main` landmark.
 */
export function GalleryPage() {
  const [sort, setSort] = useState<SortKey>("featured");
  const [shape, setShape] = useState<FlakeShape>("dendrite");
  // The date is read once per visit; `?season=on` or `?season=off` overrides it.
  const now = useMemo(() => effectiveDate(window.location.search, new Date()), []);
  const [using, setUsing] = useState<GalleryEffect | null>(null);
  // `?labels=demo` shows the status labels before a release earns them.
  const preview = useMemo(() => labelPreview(window.location.search, EFFECTS, LATEST_RELEASE), []);
  const sorted = useMemo(() => sortEffects(preview.effects, sort), [preview, sort]);
  const { seasonal, others } = useMemo(() => splitBySeason(sorted, now), [sorted, now]);
  const season = seasonal[0]?.season ? SEASONS[seasonal[0].season] : undefined;
  const flakes = EFFECTS.filter((effect) => usesFlakeShape(effect.id)).length;

  const shapeControl = (
    <div className={styles.shape}>
      <div className={styles.shapeRow}>
        <span className={styles.shapeLabel}>Flake shape</span>
        <ChipGroup
          aria-label="Flake shape"
          variant="segmented"
          value={shape}
          onValueChange={(value) => setShape(value as FlakeShape)}
        >
          {FLAKE_SHAPES.map((name) => (
            <ChipGroupItem key={name} value={name}>
              {SHAPE_NAMES[name]}
            </ChipGroupItem>
          ))}
        </ChipGroup>
      </div>
      <p className={styles.shapeNote}>
        Applies to {flakes} of {EFFECTS.length} effects. Snow on the bars and Blizzard dissolve have
        no flake.
      </p>
    </div>
  );
  const toolbar = (
    <div className={styles.toolbar}>
      <span className={styles.caption} role="status">
        {EFFECTS.length} effects
      </span>
      <Select
        label="Sort"
        value={sort}
        onValueChange={(value) => setSort(value as SortKey)}
        options={SORT_OPTIONS}
      />
    </div>
  );
  const shared = { shape, latest: preview.latest, now, onUse: setUsing };
  const sections: ReactNode[] = [];
  if (seasonal.length > 0 && season) {
    sections.push(
      <GallerySection
        key="season"
        title={season.title}
        badge={season.label}
        copy="Snowflakes made of text characters, frost and aurora. Each one rests on a still frame; hover or press it to play."
        effects={seasonal}
        showSeason={preview.showSeason}
        shapeControl={shapeControl}
        toolbar={toolbar}
        {...shared}
      />,
    );
  }
  if (others.length > 0) {
    sections.push(
      <GallerySection
        key="all"
        title="All effects"
        copy="Ready-made loaders and reveals. Each one rests on a still frame; hover or press it to play."
        effects={others}
        showSeason
        shapeControl={seasonal.length === 0 ? shapeControl : undefined}
        toolbar={seasonal.length === 0 ? toolbar : undefined}
        {...shared}
      />,
    );
  }
  return (
    <div className={styles.page}>
      <Grid rowGap="space-4">
        <GridCell>
          <header className={styles.head}>
            <h1 className={styles.title}>Gallery.</h1>
            <p className={styles.caption}>Ready-made loading effects. Hover one to play it.</p>
          </header>
        </GridCell>
      </Grid>
      {sections}
      <Grid>
        <GridCell>
          <Card as="section" size="panel" className={styles.end} aria-labelledby="gallery-end">
            <div className={styles.endText}>
              <h2 id="gallery-end" className={styles.endTitle}>
                Need something else?
              </h2>
              <p className={styles.caption}>
                Open any effect in the Playground. Change the speed, the colors and the shape, then
                copy the settings into your project.
              </p>
            </div>
            <Button variant="primary" size="lg" asChild>
              <a href={PLAYGROUND_URL}>Open the Playground</a>
            </Button>
          </Card>
        </GridCell>
      </Grid>
      <UseDrawer effect={using} shape={shape} onClose={() => setUsing(null)} />
    </div>
  );
}
