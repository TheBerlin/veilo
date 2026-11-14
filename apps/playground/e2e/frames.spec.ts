// frames.spec.ts: screenshots of the test card for every preset, at five fixed progress values
// and in the Loading view. The `dark` and `light` projects run each one in both themes.
// Baselines are made in the Playwright Docker image: `pnpm --filter playground visual:update`.

import { expect, test, type Page } from "@playwright/test";
import { PRESETS } from "@veilo/presets";

/** The progress values the milestone locks (spec: frames at fixed progress). */
const PROGRESS = [0, 0.25, 0.5, 0.75, 1];

/**
 * Opens the playground held at one frame and waits until that frame is final.
 *
 * @param page - The test's page.
 * @param presetId - The preset to load.
 * @param p - The progress to hold.
 * @returns The test card.
 */
async function openFrame(page: Page, presetId: string, p: number) {
  await page.goto(`/?preset=${presetId}&p=${p}`);
  const card = page.getByRole("button", { name: /Test card/ });
  await expect(card).toHaveAttribute("data-frame-ready", "");
  return card;
}

for (const preset of PRESETS) {
  test.describe(preset.name, () => {
    for (const p of PROGRESS) {
      // p050 rather than 0.5, so the files sort by progress.
      const name = `${preset.id}-p${String(Math.round(p * 100)).padStart(3, "0")}.png`;
      test(`p = ${p}`, async ({ page }) => {
        const card = await openFrame(page, preset.id, p);
        await expect(card).toHaveScreenshot(name);
      });
    }

    test("Loading view", async ({ page }) => {
      const card = await openFrame(page, preset.id, 0);
      // The transport's own button, as a user would press it; the sweep is frozen at its start
      // because screenshots disable animations.
      await page.getByRole("button", { name: "Loading state" }).click();
      await expect(page.getByRole("status").filter({ hasText: "Loading" })).toBeVisible();
      await expect(card).toHaveScreenshot(`${preset.id}-loading.png`);
    });
  });
}
