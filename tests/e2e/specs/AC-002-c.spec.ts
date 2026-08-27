// spec: tests/validation/test-plan.md § AC-002-c
import { test, expect } from "@playwright/test";
import { apiGet, apiPost, claimInput } from "../lib/api";

test("AC-002-c: an attached receipt can be viewed later from the claim", async ({ request }) => {
  const receiptData = Buffer.from(`validation receipt bytes ${Date.now()}`).toString("base64");
  // 1. Submit a claim with a receipt attached
  const created = await apiPost(
    request,
    "employee",
    "/expense-claims",
    claimInput({ receiptContentType: "image/png", receiptData }),
  );
  expect(created.status()).toBe(201);
  const { id } = await created.json();

  // 2. Fetch the claim again later
  const fetched = await apiGet(request, "employee", `/expense-claims/${id}`);
  // Assert: the same receipt content is returned
  expect(fetched.status()).toBe(200);
  const body = await fetched.json();
  expect(body.receiptContentType).toBe("image/png");
  expect(body.receiptData).toBe(receiptData);
});
