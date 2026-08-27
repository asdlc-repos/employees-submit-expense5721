// spec: tests/validation/test-plan.md § AC-006-a
//
// See "Confirmed platform defect" in test-plan.md: approve is expected to
// fail with 403 (caller is not this claim's manager) since no employee is
// ever assigned a manager in this deployment.
import { test, expect } from "@playwright/test";
import { apiPost, claimInput } from "../lib/api";

test("AC-006-a: a manager can approve a pending claim", async ({ request }) => {
  // 1. Employee submits a pending claim
  const created = await apiPost(request, "employee", "/expense-claims", claimInput());
  expect(created.status()).toBe(201);
  const { id } = await created.json();

  // 2. Manager approves it
  const approved = await apiPost(request, "manager", `/expense-claims/${id}/approve`, {});
  // Assert: approved
  expect(approved.status()).toBe(200);
  expect((await approved.json()).status).toBe("approved");
});
