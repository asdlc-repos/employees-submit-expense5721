// spec: tests/validation/test-plan.md § AC-005-a
//
// See "Confirmed platform defect" in test-plan.md: no employee is ever
// assigned a manager in this deployment, so this manager's pending queue is
// expected to stay empty even for a claim the employee just submitted.
import { test, expect } from "@playwright/test";
import { apiGet, apiPost, claimInput } from "../lib/api";

test("AC-005-a: a manager sees a list of pending claims submitted by their direct reports", async ({ request }) => {
  // 1. Employee submits a pending claim
  const created = await apiPost(request, "employee", "/expense-claims", claimInput());
  expect(created.status()).toBe(201);
  const { id } = await created.json();

  // 2. Manager checks their pending queue
  const pending = await apiGet(request, "manager", "/expense-claims?status=pending&limit=100");
  const body = await pending.json();

  // Assert: the employee's claim is visible to their manager
  expect((body.data as { id: string }[]).some((c) => c.id === id)).toBe(true);
});
