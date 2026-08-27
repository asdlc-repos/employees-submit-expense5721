// Shared helpers for API-fixture specs: the expense-api contract is reached
// through expense-webapp's own /api proxy (see test-plan.md — the direct
// gateway URL in targets.json rejects the SPA's bearer token on audience
// mismatch), authenticated with the token saved per role by global-setup.ts.
import type { APIRequestContext } from "@playwright/test";
import { target } from "./targets";
import { tokenFor, type Role } from "./auth";

export function apiUrl(path: string): string {
  return `${target("expense-webapp")}/api${path}`;
}

function authHeaders(role: Role) {
  return { Authorization: `Bearer ${tokenFor(role)}` };
}

export function apiGet(request: APIRequestContext, role: Role, path: string) {
  return request.get(apiUrl(path), { headers: authHeaders(role) });
}

export function apiPost(request: APIRequestContext, role: Role, path: string, data: unknown = {}) {
  return request.post(apiUrl(path), { headers: authHeaders(role), data });
}

export function apiPut(request: APIRequestContext, role: Role, path: string, data: unknown) {
  return request.put(apiUrl(path), { headers: authHeaders(role), data });
}

export interface ClaimInputOverrides {
  amount?: number;
  category?: string;
  expenseDate?: string;
  description?: string;
  receiptContentType?: string;
  receiptData?: string;
}

let counter = 0;

export function claimInput(overrides: ClaimInputOverrides = {}) {
  counter += 1;
  return {
    amount: 42.5,
    category: "Travel",
    expenseDate: "2026-08-20",
    description: `validation claim ${Date.now()}-${counter}`,
    ...overrides,
  };
}
