// spec: tests/validation/test-plan.md § AC-006-b
//
// See "Confirmed platform defect" in test-plan.md: reject is expected to
// fail with 403 for the same reason as AC-006-a.
import { test, expect } from "@playwright/test";
import { apiPost, claimInput } from "../lib/api";

test("AC-006-b: a manager can reject a pending claim", async ({ request }) => {
  // 1. Employee submits a pending claim
  const created = await apiPost(request, "employee", "/expense-claims", claimInput());
  expect(created.status()).toBe(201);
  const { id } = await created.json();

  // 2. Manager rejects it
  const rejected = await apiPost(request, "manager", `/expense-claims/${id}/reject`, {});
  // Assert: rejected
  expect(rejected.status()).toBe(200);
  expect((await rejected.json()).status).toBe("rejected");
});
