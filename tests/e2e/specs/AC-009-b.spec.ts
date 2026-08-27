// spec: tests/validation/test-plan.md § AC-009-b
//
// Setup requires an approved, then exported, claim. See "Confirmed platform
// defect" in test-plan.md: the manager approve step below is expected to
// fail with 403.
import { test, expect } from "@playwright/test";
import { apiPost, claimInput } from "../lib/api";

test("AC-009-b: an already-exported claim cannot be exported again", async ({ request }) => {
  // 1. Employee submits a claim
  const created = await apiPost(request, "employee", "/expense-claims", claimInput());
  expect(created.status()).toBe(201);
  const { id } = await created.json();

  // 2. Manager approves it
  const approved = await apiPost(request, "manager", `/expense-claims/${id}/approve`, {});
  expect(approved.status()).toBe(200);

  // 3. Finance exports it once
  const firstExport = await apiPost(request, "finance", "/expense-claims/export", {});
  expect(firstExport.status()).toBe(200);
  expect(await firstExport.text()).toContain(id);

  // 4. Finance exports again
  const secondExport = await apiPost(request, "finance", "/expense-claims/export", {});
  expect(secondExport.status()).toBe(200);
  // Assert: the already-exported claim is not included the second time
  expect(await secondExport.text()).not.toContain(id);
});
