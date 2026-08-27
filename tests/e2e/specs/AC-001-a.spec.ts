// spec: tests/validation/test-plan.md § AC-001-a
import { test, expect } from "@playwright/test";
import { storageStatePath } from "../lib/auth";

test.use({ storageState: storageStatePath("employee") });

test("AC-001-a: an employee can create a claim by entering amount, category, date, and description", async ({
  page,
}) => {
  const description = `Team lunch validation ${Date.now()}`;
  // 1. Navigate to the new claim form (via My Claims — a direct deep-link
  // load intermittently races the SPA's runtime env-config script on this
  // deployment, so route through the app's own navigation instead)
  await page.goto("/");
  await page.getByRole("button", { name: "New claim" }).click();
  // 2. Select category
  await page.getByRole("combobox", { name: "Category Required" }).click();
  await page.getByRole("option", { name: "Meals" }).click();
  // 3. Enter date
  await page.getByRole("combobox", { name: "Date Required" }).fill("2026-08-20");
  // 4. Enter amount
  await page.getByRole("spinbutton", { name: "Amount Required" }).fill("42.5");
  // 5. Enter description
  await page.getByRole("textbox", { name: "Description Required" }).fill(description);
  // 6. Submit
  await page.getByRole("button", { name: "Submit claim" }).click();
  // Assert: the claim detail page reflects the entered category, amount, and description
  await expect(page.getByRole("heading", { name: "Meals — $42.50" })).toBeVisible();
  await expect(page.getByText(description)).toBeVisible();
});
