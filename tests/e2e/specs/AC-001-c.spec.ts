// spec: tests/validation/test-plan.md § AC-001-c
import { test, expect } from "@playwright/test";
import { apiPost, claimInput } from "../lib/api";

test("AC-001-c: the category must be one of the fixed list", async ({ request }) => {
  // 1. Submit with a category outside Travel/Meals/Lodging/Supplies/Other
  const invalid = await apiPost(request, "employee", "/expense-claims", claimInput({ category: "NotACategory" }));
  // Assert: rejected
  expect(invalid.status()).toBe(400);

  // 2. Submit with a category from the fixed list
  const valid = await apiPost(request, "employee", "/expense-claims", claimInput({ category: "Lodging" }));
  // Assert: accepted with that category
  expect(valid.status()).toBe(201);
  const body = await valid.json();
  expect(body.category).toBe("Lodging");
});
