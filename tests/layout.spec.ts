import { test, expect } from "@playwright/test";

test.describe("Phase 1: Tailwind CSS Pipeline & Layout Proof", () => {
  test("proves spacing and sizing utilities are compiled and rendered correctly", async ({
    page,
  }) => {
    await page.goto("/");

    const proofEl = page.locator('[data-testid="tailwind-proof"]');
    await expect(proofEl).toBeVisible();

    const box = await proofEl.boundingBox();
    expect(box).not.toBeNull();

    // w-64 should compute to 256px (allowing subpixel rounding +/- 2px)
    expect(box!.width).toBeGreaterThanOrEqual(254);
    expect(box!.width).toBeLessThanOrEqual(258);

    // h-16 should compute to 64px
    expect(box!.height).toBeGreaterThanOrEqual(62);
    expect(box!.height).toBeLessThanOrEqual(66);

    // Check computed padding (p-4 -> 16px)
    const padding = await proofEl.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.paddingTop;
    });
    expect(padding).toBe("16px");
  });

  test("proves accessibility landmarks and heading structure", async ({ page }) => {
    await page.goto("/");

    // Skip link exists
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();

    // Main landmark exists
    const main = page.locator("main#main-content");
    await expect(main).toBeVisible();

    // H1 exists
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
  });
});
