// spec: tests/validation/test-plan.md § AC-001-b
import { test, expect } from "@playwright/test";
import { apiPost, claimInput } from "../lib/api";

test("AC-001-b: a newly submitted claim has status pending", async ({ request }) => {
  // 1. Submit a valid claim as the employee
  const res = await apiPost(request, "employee", "/expense-claims", claimInput());
  // Assert: created with status pending
  expect(res.status()).toBe(201);
  const body = await res.json();
  expect(body.status).toBe("pending");
});
