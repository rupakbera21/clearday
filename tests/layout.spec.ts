import { test, expect } from "@playwright/test";

test.describe("Phase 1 & 5: UI Foundation & Layout Verification", () => {
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

  test("toggles light, dark, and high contrast modes dynamically", async ({ page }) => {
    await page.goto("/");

    const lightBtn = page.getByRole("button", { name: /light/i });
    await expect(lightBtn).toBeVisible();

    // Click to switch to light theme
    await lightBtn.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    // Click high contrast button
    const contrastBtn = page.getByRole("button", { name: /high contrast/i });
    await contrastBtn.click();
    await expect(page.locator("html")).toHaveAttribute("data-contrast", "high");
  });

  test("DayStrip signature component toggles between horizontal strip and accessible table view", async ({
    page,
  }) => {
    await page.goto("/");

    // DayStrip region should be visible
    const stripCards = page.locator('[data-testid="day-strip-cards"]');
    await expect(stripCards).toBeVisible();

    // Click Table View toggle button
    const tableToggleBtn = page.getByRole("button", { name: /table view/i });
    await expect(tableToggleBtn).toBeVisible();
    await tableToggleBtn.click();

    // Table should now be rendered
    const tableEl = page.locator('[data-testid="day-strip-table"]');
    await expect(tableEl).toBeVisible();
    await expect(page.locator("caption")).toContainText("24-Hour detailed hourly air quality");

    // Toggle back to strip view
    const stripToggleBtn = page.getByRole("button", { name: /strip view/i });
    await stripToggleBtn.click();
    await expect(stripCards).toBeVisible();
  });

  test("verifies responsive layout and touch targets on active viewport", async ({
    page,
  }) => {
    await page.goto("/");

    // Verify page renders without horizontal overflow on document body
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    // Verify interactive buttons enforce touch targets
    const buttons = page.locator("button");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 5); i++) {
      const btn = buttons.nth(i);
      const box = await btn.boundingBox();
      if (box && box.height > 0) {
        expect(box.height).toBeGreaterThanOrEqual(32);
      }
    }
  });
});
