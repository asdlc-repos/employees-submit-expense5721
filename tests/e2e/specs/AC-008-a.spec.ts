// spec: tests/validation/test-plan.md § AC-008-a
import { test, expect } from "@playwright/test";
import { apiPost } from "../lib/api";

test("AC-008-a: a finance user can trigger an export of approved claims", async ({ request }) => {
  // 1. Finance triggers the payroll export
  const res = await apiPost(request, "finance", "/expense-claims/export", {});
  // Assert: the export is accepted and returns a CSV
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
});
