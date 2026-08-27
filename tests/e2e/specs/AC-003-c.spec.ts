// spec: tests/validation/test-plan.md § AC-003-c
//
// Only one Employee-role test account is provisioned (see the roles-gate
// ticket referenced in test-plan.md), so there is no second real Employee
// identity to sign in as a peer. This uses "manager"'s session purely as a
// distinct authenticated caller who does not own the claim (not exercising
// its Manager role) to verify the same ownership-scoping boundary.
import { test, expect } from "@playwright/test";
import { apiGet, apiPost, claimInput } from "../lib/api";

test("AC-003-c: an employee cannot see another employee's claims", async ({ request }) => {
  // 1. Employee submits a claim
  const created = await apiPost(request, "employee", "/expense-claims", claimInput());
  expect(created.status()).toBe(201);
  const { id } = await created.json();

  // 2. A different, non-owning caller tries to fetch it directly
  const getById = await apiGet(request, "manager", `/expense-claims/${id}`);
  // Assert: forbidden
  expect(getById.status()).toBe(403);

  // 3. The same caller's own claims list does not include it either
  const ownList = await apiGet(request, "manager", "/expense-claims?limit=100");
  const listBody = await ownList.json();
  expect((listBody.data as { id: string }[]).some((c) => c.id === id)).toBe(false);
});
