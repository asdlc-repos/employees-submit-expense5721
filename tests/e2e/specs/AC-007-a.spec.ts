// spec: tests/validation/test-plan.md § AC-007-a
//
// Setup requires an approved claim. See "Confirmed platform defect" in
// test-plan.md: the manager approve step below is expected to fail with
// 403, since no employee is ever assigned a manager in this deployment.
import { test, expect } from "@playwright/test";
import { apiGet, apiPost, claimInput } from "../lib/api";

test("AC-007-a: a finance user sees a list of approved claims that have not yet been exported", async ({ request }) => {
  // 1. Employee submits a claim
  const created = await apiPost(request, "employee", "/expense-claims", claimInput());
  expect(created.status()).toBe(201);
  const { id } = await created.json();

  // 2. Manager approves it
  const approved = await apiPost(request, "manager", `/expense-claims/${id}/approve`, {});
  expect(approved.status()).toBe(200);

  // 3. Finance checks the awaiting-export list
  const awaiting = await apiGet(request, "finance", "/expense-claims?status=approved&exported=false&limit=100");
  const body = await awaiting.json();
  // Assert: the newly approved claim is visible to finance
  expect((body.data as { id: string }[]).some((c) => c.id === id)).toBe(true);
});
