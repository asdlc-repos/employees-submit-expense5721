// spec: tests/validation/test-plan.md § AC-003-b
import { test, expect } from "@playwright/test";
import { apiPost, claimInput } from "../lib/api";
import { storageStatePath } from "../lib/auth";

// The amount doubles as this run's unique marker — see AC-003-a.spec.ts.
function uniqueAmount(offset: number): number {
  return Number((100 + ((Date.now() + offset) % 89900) / 100).toFixed(2));
}

test.use({ storageState: storageStatePath("employee") });

test("AC-003-b: each listed claim shows its current status", async ({ page, request }) => {
  // 1. Submit a claim (freshly created — always starts pending)
  const amount = uniqueAmount(3);
  const created = await apiPost(request, "employee", "/expense-claims", claimInput({ amount, category: "Supplies" }));
  expect(created.status()).toBe(201);

  // 2. Open My Claims
  await page.goto("/");

  // Assert: the row for this claim shows a "Pending" status
  const amountText = amount.toFixed(2).replace(".", "\\.");
  const row = page.getByRole("row", { name: new RegExp(`Supplies.*\\$${amountText}`) });
  await expect(row).toBeVisible();
  await expect(row.getByText("Pending")).toBeVisible();
});
