// spec: tests/validation/test-plan.md § AC-004-b
//
// Same blocked precondition as AC-004-a — see test-plan.md's "Confirmed
// platform defect": the manager reject step below is expected to fail with
// 403, since no employee ever has a manager assigned in this deployment.
import { test, expect } from "@playwright/test";
import { apiPost, apiPut, claimInput } from "../lib/api";

test("AC-004-b: resubmitting an edited claim sets its status back to pending", async ({ request }) => {
  // 1. Employee submits a claim
  const created = await apiPost(request, "employee", "/expense-claims", claimInput());
  expect(created.status()).toBe(201);
  const { id } = await created.json();

  // 2. Manager rejects it
  const rejected = await apiPost(request, "manager", `/expense-claims/${id}/reject`, {});
  expect(rejected.status()).toBe(200);

  // 3. The employee edits and resubmits it
  const edited = await apiPut(request, "employee", `/expense-claims/${id}`, claimInput());
  expect(edited.status()).toBe(200);
  // Assert: status is back to pending
  expect((await edited.json()).status).toBe("pending");
});
