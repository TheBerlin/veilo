// frames.spec.ts: screenshots of the test card for every preset, at five fixed progress values
// and in the Loading view. The `dark` and `light` projects run each one in both themes.
// Baselines are made in the Playwright Docker image: `pnpm --filter playground visual:update`.

import { expect, test, type Page } from "@playwright/test";
import { PRESETS } from "@veilo-ui/presets";
import { frameName, PROGRESS } from "./support/baselines.ts";

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
      test(`p = ${p}`, async ({ page }) => {
        const card = await openFrame(page, preset.id, p);
        await expect(card).toHaveScreenshot(frameName(preset.id, p));
      });
    }

    test("Loading view", async ({ page }) => {
      const card = await openFrame(page, preset.id, 0);
      // The transport's own button, as a user would press it; the sweep is frozen at its start
      // because screenshots disable animations.
      await page.getByRole("button", { name: "Loading state" }).click();
      await expect(page.getByRole("status").filter({ hasText: "Loading" })).toBeVisible();
      await expect(card).toHaveScreenshot(frameName(preset.id, "loading"));
    });
  });
}
