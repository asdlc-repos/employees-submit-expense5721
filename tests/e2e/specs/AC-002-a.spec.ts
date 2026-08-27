// spec: tests/validation/test-plan.md § AC-002-a
import path from "node:path";
import { test, expect } from "@playwright/test";
import { storageStatePath } from "../lib/auth";

test.use({ storageState: storageStatePath("employee") });

test("AC-002-a: an employee can attach a receipt image when submitting a claim", async ({ page }) => {
  const description = `Receipt attach validation ${Date.now()}`;
  // 1. Navigate to the new claim form
  await page.goto("/");
  await page.getByRole("button", { name: "New claim" }).click();
  // 2. Fill required fields
  await page.getByRole("combobox", { name: "Date Required" }).fill("2026-08-22");
  await page.getByRole("spinbutton", { name: "Amount Required" }).fill("18.75");
  await page.getByRole("textbox", { name: "Description Required" }).fill(description);
  // 3. Attach a receipt image
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("button", { name: "Attach receipt" }).click(),
  ]);
  await fileChooser.setFiles(path.join(__dirname, "..", "fixtures", "receipt.png"));
  // 4. Submit
  await page.getByRole("button", { name: "Submit claim" }).click();
  // Assert: the claim detail page shows the attached receipt, not the empty state
  await expect(page.getByRole("button", { name: /Open Receipt/ })).toBeVisible();
  await expect(page.getByText("No receipt attached.")).not.toBeVisible();
});
