// spec: tests/validation/test-plan.md § AC-009-a
//
// Setup requires an approved claim. See "Confirmed platform defect" in
// test-plan.md: the manager approve step below is expected to fail with
// 403.
import { test, expect } from "@playwright/test";
import { apiGet, apiPost, claimInput } from "../lib/api";

test("AC-009-a: a claim included in an export is marked as exported", async ({ request }) => {
  // 1. Employee submits a claim
  const created = await apiPost(request, "employee", "/expense-claims", claimInput());
  expect(created.status()).toBe(201);
  const { id } = await created.json();

  // 2. Manager approves it
  const approved = await apiPost(request, "manager", `/expense-claims/${id}/approve`, {});
  expect(approved.status()).toBe(200);

  // 3. Finance exports approved claims
  const exported = await apiPost(request, "finance", "/expense-claims/export", {});
  expect(exported.status()).toBe(200);

  // 4. Re-fetch the claim
  const fetched = await apiGet(request, "employee", `/expense-claims/${id}`);
  const body = await fetched.json();
  // Assert: it is now marked exported
  expect(body.exportedAt).not.toBeNull();
});
