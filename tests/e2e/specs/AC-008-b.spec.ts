// spec: tests/validation/test-plan.md § AC-008-b
//
// Setup requires an approved claim. See "Confirmed platform defect" in
// test-plan.md: the manager approve step below is expected to fail with
// 403, so the export can never contain this claim's data.
import { test, expect } from "@playwright/test";
import { apiPost, claimInput } from "../lib/api";

test("AC-008-b: the export produces a downloadable file containing the exported claims' data", async ({ request }) => {
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
  const csv = await exported.text();
  // Assert: the CSV body contains this claim's data
  expect(csv).toContain(id);
});
