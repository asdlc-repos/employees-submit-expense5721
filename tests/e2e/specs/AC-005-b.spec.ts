// spec: tests/validation/test-plan.md § AC-005-b
import { test, expect } from "@playwright/test";
import { apiGet, apiPost, claimInput } from "../lib/api";

test("AC-005-b: a manager does not see pending claims from employees who are not their direct reports", async ({
  request,
}) => {
  // 1. Employee (not a direct report of this manager) submits a pending claim
  const created = await apiPost(request, "employee", "/expense-claims", claimInput());
  expect(created.status()).toBe(201);
  const { id } = await created.json();

  // 2. Manager checks their pending queue
  const pending = await apiGet(request, "manager", "/expense-claims?status=pending&limit=100");
  const body = await pending.json();

  // Assert: the non-report's claim is absent
  expect((body.data as { id: string }[]).some((c) => c.id === id)).toBe(false);
});
