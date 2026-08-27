// spec: tests/validation/test-plan.md § AC-006-d
//
// See "Confirmed platform defect" in test-plan.md: the manager's approve
// call below is expected to fail with 403, so the employee never has a
// decision/comment to see.
import { test, expect } from "@playwright/test";
import { apiGet, apiPost, claimInput } from "../lib/api";

test("AC-006-d: the employee can see the manager's decision and comment on their claim", async ({ request }) => {
  // 1. Employee submits a pending claim
  const created = await apiPost(request, "employee", "/expense-claims", claimInput());
  expect(created.status()).toBe(201);
  const { id } = await created.json();

  // 2. Manager approves it with a comment
  const comment = "Approved — receipts verified";
  const approved = await apiPost(request, "manager", `/expense-claims/${id}/approve`, { comment });
  expect(approved.status()).toBe(200);

  // 3. The employee views their own claim
  const viewed = await apiGet(request, "employee", `/expense-claims/${id}`);
  const body = await viewed.json();
  // Assert: the decision and comment are visible to the employee
  expect(body.status).toBe("approved");
  expect(body.managerComment).toBe(comment);
});
