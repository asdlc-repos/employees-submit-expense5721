// spec: tests/validation/test-plan.md § AC-007-b
//
// Setup requires an approved, then exported, claim. See "Confirmed platform
// defect" in test-plan.md: the manager approve step below is expected to
// fail with 403.
import { test, expect } from "@playwright/test";
import { apiGet, apiPost, claimInput } from "../lib/api";

test("AC-007-b: a previously exported claim no longer appears in the awaiting-export list", async ({ request }) => {
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

  // 4. Finance re-checks the awaiting-export list
  const awaiting = await apiGet(request, "finance", "/expense-claims?status=approved&exported=false&limit=100");
  const body = await awaiting.json();
  // Assert: the exported claim is no longer listed as awaiting export
  expect((body.data as { id: string }[]).some((c) => c.id === id)).toBe(false);
});
