import { expect, test } from "@playwright/test";

test("landing page loads the readiness journey", async ({ page }) => {
  await page.goto("/r/demo");
  await expect(page.getByRole("heading")).toContainText(/तैयार|ready/i);
  await expect(page.getByRole("link", { name: /तैयारी|Readiness/i })).toBeVisible();
});
