// spec: tests/validation/test-plan.md § AC-002-b
import { test, expect } from "@playwright/test";
import { apiPost, claimInput } from "../lib/api";

test("AC-002-b: a claim can be submitted without a receipt attachment", async ({ request }) => {
  // 1. Submit a claim with no receiptContentType/receiptData
  const res = await apiPost(request, "employee", "/expense-claims", claimInput());
  // Assert: created successfully with no receipt
  expect(res.status()).toBe(201);
  const body = await res.json();
  expect(body.hasReceipt).toBe(false);
});
