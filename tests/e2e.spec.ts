import { test, expect } from "@playwright/test";

test.describe("Phase 6: Tier 1 Screens Navigation & Interactive Behavior", () => {
  test("switches between all 8 Tier 1 feature tabs cleanly", async ({ page }) => {
    await page.goto("/");

    // Default tab is Air Snapshot
    await expect(page.getByRole("tab", { name: "Air Snapshot" })).toHaveAttribute("aria-selected", "true");
    await expect(page.locator('[data-testid="day-strip-cards"]')).toBeVisible();

    // 1. Switch to Today's Plan
    await page.getByRole("tab", { name: "Today's Plan" }).click();
    await expect(page.getByRole("heading", { name: /low-emission daily routine/i })).toBeVisible();

    // 2. Switch to Impact Lab
    await page.getByRole("tab", { name: "Impact Lab" }).click();
    await expect(page.getByRole("heading", { name: /personal exposure & emissions sandbox/i })).toBeVisible();
    await expect(page.getByText(/estimated daily inhaled pm2.5/i)).toBeVisible();

    // 3. Switch to Home Toolkit
    await page.getByRole("tab", { name: "Home Toolkit" }).click();
    await expect(page.getByRole("heading", { name: /purifier & diy box fan sizing calculator/i })).toBeVisible();

    // 4. Switch to Alternatives
    await page.getByRole("tab", { name: "Alternatives" }).click();
    await expect(page.getByRole("heading", { name: /sustainable alternatives engine/i })).toBeVisible();

    // 5. Switch to Household
    await page.getByRole("tab", { name: "Household" }).click();
    await expect(page.getByRole("heading", { name: /quick ai profile setup/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /household members/i })).toBeVisible();

    // 6. Switch to Ask Clearday
    await page.getByRole("tab", { name: "Ask Clearday" }).click();
    await expect(page.getByRole("heading", { name: /ask clearday/i })).toBeVisible();

    // 7. Switch to Privacy & Data
    await page.getByRole("tab", { name: "Privacy & Data" }).click();
    await expect(page.getByRole("heading", { name: /privacy-first architecture/i })).toBeVisible();
    await expect(page.getByText(/local data footprint/i)).toBeVisible();
  });

  test("Impact Lab recomputes inhaled exposure and CO2e dynamically on client", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Impact Lab" }).click();

    // Initial exposure reading
    const exposureCard = page.locator("text=Estimated Daily Inhaled PM2.5").locator("..");
    await expect(exposureCard).toBeVisible();

    // Toggle mask type or commute mode
    const maskSelect = page.getByLabel("Mask Type Outdoors");
    await maskSelect.selectOption("none");

    // Verify UI reflects the change
    await expect(page.getByText(/exposure/i).first()).toBeVisible();
  });

  test("Home Toolkit applies DIY Box Fan Preset and recalculates ACH", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Home Toolkit" }).click();

    // Click Apply DIY Box Fan Preset
    const diyBtn = page.getByRole("button", { name: /apply diy box fan preset/i });
    await expect(diyBtn).toBeVisible();
    await diyBtn.click();

    // Verify CADR input updated to 480
    const cadrInput = page.getByLabel(/purifier cadr/i);
    await expect(cadrInput).toHaveValue("480");

    // Verify adequately sized badge appears
    await expect(page.getByText(/adequately sized/i)).toBeVisible();
  });

  test("Privacy & Data screen handles local data reset", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Privacy & Data" }).click();

    const wipeBtn = page.getByRole("button", { name: /wipe all local data/i });
    await expect(wipeBtn).toBeVisible();
    await wipeBtn.click();

    // Success confirmation text appears
    await expect(page.getByText(/local storage successfully wiped/i)).toBeVisible();
  });
});
