import type { ClaimStatus } from "./api";

export function statusBadgeVariant(status: ClaimStatus): "warning" | "success" | "error" {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  return "warning";
}

export function statusLabel(status: ClaimStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}
