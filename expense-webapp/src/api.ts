import createClient from "openapi-fetch";
import type { paths, components } from "./generated/expense-api";
import { getAccessToken, signIn } from "./auth";

export type ClaimStatus = components["schemas"]["ClaimStatus"];
export type ClaimCategory = components["schemas"]["ClaimCategory"];
export type Employee = components["schemas"]["Employee"];
export type ExpenseClaim = components["schemas"]["ExpenseClaim"];
export type ExpenseClaimSummary = components["schemas"]["ExpenseClaimSummary"];
export type ExpenseClaimInput = components["schemas"]["ExpenseClaimInput"];
export type DecisionInput = components["schemas"]["DecisionInput"];

// Same-origin — nginx proxies /api to the expense-api sibling through the
// gateway (see nginx/15-aep-api-proxy.sh), preferring the auth-terminating
// EXPENSE_API_GATEWAY_URL over the direct EXPENSE_API_URL.
export const expenseApi = createClient<paths>({ baseUrl: "/api" });

expenseApi.use({
  async onRequest({ request }) {
    const token = await getAccessToken();
    if (token) request.headers.set("Authorization", `Bearer ${token}`);
    return request;
  },
  async onResponse({ response }) {
    if (response.status === 401) {
      // Token missing/expired past silent renewal — restart sign-in.
      await signIn();
    }
    return response;
  },
});

// The X-User-* headers expense-api's contract declares are gateway-injected
// from the validated bearer token, never browser-supplied: nginx's proxy
// clears any inbound copy of them before forwarding (see nginx/default.conf).
// openapi-fetch's generated types still require them on every call because
// the OpenAPI document lists them as required request headers, so these
// placeholders exist only to satisfy that shape — their values are discarded
// before the request leaves this pod.
const identityHeaders = {
  "X-User-Id": "",
  "X-User-Name": "",
  "X-User-Groups": "",
} as const;

export class ApiError extends Error {
  code?: number;
  constructor(message: string, code?: number) {
    super(message);
    this.code = code;
  }
}

function unwrapError(error: unknown): never {
  const e = error as { message?: string; code?: number } | undefined;
  throw new ApiError(e?.message ?? "Request failed", e?.code);
}

export interface ListClaimsParams {
  status?: ClaimStatus;
  exported?: boolean;
  limit?: number;
  offset?: number;
}

export async function listClaims(params: ListClaimsParams = {}) {
  const { data, error } = await expenseApi.GET("/expense-claims", {
    params: { query: params, header: identityHeaders },
  });
  if (error) unwrapError(error);
  return data!;
}

export async function getClaim(claimId: string): Promise<ExpenseClaim> {
  const { data, error } = await expenseApi.GET("/expense-claims/{claimId}", {
    params: { path: { claimId }, header: identityHeaders },
  });
  if (error) unwrapError(error);
  return data!;
}

export async function submitClaim(input: ExpenseClaimInput): Promise<ExpenseClaim> {
  const { data, error } = await expenseApi.POST("/expense-claims", {
    params: { header: identityHeaders },
    body: input,
  });
  if (error) unwrapError(error);
  return data!;
}

export async function updateClaim(claimId: string, input: ExpenseClaimInput): Promise<ExpenseClaim> {
  const { data, error } = await expenseApi.PUT("/expense-claims/{claimId}", {
    params: { path: { claimId }, header: identityHeaders },
    body: input,
  });
  if (error) unwrapError(error);
  return data!;
}

export async function approveClaim(claimId: string, comment?: string): Promise<ExpenseClaim> {
  const { data, error } = await expenseApi.POST("/expense-claims/{claimId}/approve", {
    params: { path: { claimId }, header: identityHeaders },
    body: comment ? { comment } : {},
  });
  if (error) unwrapError(error);
  return data!;
}

export async function rejectClaim(claimId: string, comment?: string): Promise<ExpenseClaim> {
  const { data, error } = await expenseApi.POST("/expense-claims/{claimId}/reject", {
    params: { path: { claimId }, header: identityHeaders },
    body: comment ? { comment } : {},
  });
  if (error) unwrapError(error);
  return data!;
}

export async function getCurrentEmployee(): Promise<Employee> {
  const { data, error } = await expenseApi.GET("/employees/me", {
    params: { header: identityHeaders },
  });
  if (error) unwrapError(error);
  return data!;
}

// The export endpoint returns text/csv, not JSON, so it is fetched directly
// rather than through the typed JSON client — same-origin /api path, same
// bearer attachment as every other call.
export async function exportClaims(): Promise<Blob> {
  const token = await getAccessToken();
  const res = await fetch("/api/expense-claims/export", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    await signIn();
    throw new ApiError("Not signed in", 401);
  }
  if (!res.ok) {
    let message = "Export failed";
    try {
      const body = await res.json();
      message = body?.message ?? message;
    } catch {
      // response was not JSON (e.g. empty body) — keep the generic message
    }
    throw new ApiError(message, res.status);
  }
  return res.blob();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Encodes a browser File as base64 for ExpenseClaimInput.receiptData.
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result is a data: URL — strip the "data:<mime>;base64," prefix.
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function receiptDataUrl(contentType: string | null | undefined, data: string | null | undefined) {
  if (!contentType || !data) return null;
  return `data:${contentType};base64,${data}`;
}
