// spec: tests/validation/test-plan.md § AC-004-a
//
// Setup requires a rejected claim, which requires the manager to reject a
// pending claim. See "Confirmed platform defect" in test-plan.md: no
// employee ever has a manager assigned in this deployment, so the reject
// step below is expected to fail with 403, not 200 — that failure is this
// criterion's honest result, not a flaw in the test.
import { test, expect } from "@playwright/test";
import { apiPost, apiPut, claimInput } from "../lib/api";

test("AC-004-a: a rejected claim can be edited by the employee who submitted it", async ({ request }) => {
  // 1. Employee submits a claim
  const created = await apiPost(request, "employee", "/expense-claims", claimInput());
  expect(created.status()).toBe(201);
  const { id } = await created.json();

  // 2. Manager rejects it
  const rejected = await apiPost(request, "manager", `/expense-claims/${id}/reject`, { comment: "needs more detail" });
  expect(rejected.status()).toBe(200);
  expect((await rejected.json()).status).toBe("rejected");

  // 3. The employee edits and resubmits the now-rejected claim
  const edited = await apiPut(request, "employee", `/expense-claims/${id}`, claimInput({ description: "revised description" }));
  // Assert: the edit is accepted
  expect(edited.status()).toBe(200);
});
