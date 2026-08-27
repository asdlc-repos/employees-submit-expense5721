// spec: tests/validation/test-plan.md § AC-006-c
//
// See "Confirmed platform defect" in test-plan.md: the approve call below is
// expected to fail with 403 for the same reason as AC-006-a.
import { test, expect } from "@playwright/test";
import { apiPost, claimInput } from "../lib/api";

test("AC-006-c: a manager can add a comment when approving or rejecting", async ({ request }) => {
  // 1. Employee submits a pending claim
  const created = await apiPost(request, "employee", "/expense-claims", claimInput());
  expect(created.status()).toBe(201);
  const { id } = await created.json();

  // 2. Manager approves it with a comment
  const comment = "Approved — receipts verified";
  const approved = await apiPost(request, "manager", `/expense-claims/${id}/approve`, { comment });
  // Assert: the comment is stored on the decided claim
  expect(approved.status()).toBe(200);
  expect((await approved.json()).managerComment).toBe(comment);
});
