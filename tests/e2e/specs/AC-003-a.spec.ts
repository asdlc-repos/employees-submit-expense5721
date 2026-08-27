// spec: tests/validation/test-plan.md § AC-003-a
import { test, expect } from "@playwright/test";
import { apiPost, claimInput } from "../lib/api";
import { storageStatePath } from "../lib/auth";

// Amounts double as this run's unique marker — the deployed environment
// persists claims across runs, and My Claims shows no description column,
// so a fixed literal would collide with an earlier run's row.
function uniqueAmount(offset: number): number {
  return Number((100 + ((Date.now() + offset) % 89900) / 100).toFixed(2));
}

test.use({ storageState: storageStatePath("employee") });

test("AC-003-a: an employee sees a list of all claims they submitted", async ({ page, request }) => {
  // 1. Submit two distinct claims as the employee via the API
  const amountA = uniqueAmount(1);
  const amountB = uniqueAmount(2);
  const claimA = await apiPost(request, "employee", "/expense-claims", claimInput({ amount: amountA, category: "Travel" }));
  const claimB = await apiPost(request, "employee", "/expense-claims", claimInput({ amount: amountB, category: "Meals" }));
  expect(claimA.status()).toBe(201);
  expect(claimB.status()).toBe(201);

  // 2. Open My Claims
  await page.goto("/");

  // Assert: both submitted claims are listed
  const amountAText = amountA.toFixed(2).replace(".", "\\.");
  const amountBText = amountB.toFixed(2).replace(".", "\\.");
  await expect(page.getByRole("row", { name: new RegExp(`Travel.*\\$${amountAText}`) })).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(`Meals.*\\$${amountBText}`) })).toBeVisible();
});
