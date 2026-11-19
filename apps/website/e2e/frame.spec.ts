// frame.spec.ts: the fixed-frame URL opens the playground paused on a preset at an exact progress.

import { expect, test } from "@playwright/test";

test("a frame request holds the card at that progress", async ({ page }) => {
  await page.goto("/playground?preset=hex-from-center&p=0.5");
  const card = page.getByRole("button", { name: /Test card/ });
  // The card is marked once the frame is drawn with the final fonts.
  await expect(card).toHaveAttribute("data-frame-ready", "");
  // The preset's chip is lit, and the transport shows the held progress, paused.
  await expect(page.getByRole("radio", { name: "Hex from center" })).toBeChecked();
  await expect(page.getByRole("slider", { name: /progress|scrub/i })).toHaveAttribute(
    "aria-valuetext",
    "50%",
  );
  // Both fonts come from the app itself.
  const fonts = await page.evaluate(() => ({
    geist: document.fonts.check('16px "Geist"'),
    plex: document.fonts.check('16px "IBM Plex Mono"'),
  }));
  expect(fonts).toEqual({ geist: true, plex: true });
});

test("a page without a frame request plays as usual", async ({ page }) => {
  await page.goto("/playground");
  await expect(page.getByRole("button", { name: /Test card/ })).not.toHaveAttribute(
    "data-frame-ready",
  );
});
