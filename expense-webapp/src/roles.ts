// Resolves the signed-in caller's role client-side from their ID token's
// `groups` claim (oidc-client-ts surfaces it as user.profile.groups, read via
// getRoles() in auth.ts). Matched case-insensitively against the three roles
// this project declares in specs/design/roles.json; a caller in none of them
// defaults to Employee, the cold-start role. specs/design/security.md and
// roles.json are the source of truth for this mapping — do not invent a
// fourth role or a different default.
export type Role = "Employee" | "Manager" | "Finance";

const COLD_START_ROLE: Role = "Employee";

export function resolveRole(groups: string[]): Role {
  const lower = groups.map((g) => g.toLowerCase());
  if (lower.some((g) => g.includes("finance"))) return "Finance";
  if (lower.some((g) => g.includes("manager"))) return "Manager";
  if (lower.some((g) => g.includes("employee"))) return "Employee";
  return COLD_START_ROLE;
}

// The screens each role may reach — specs/design/roles.json permissions[].
export const ROLE_HOME: Record<Role, string> = {
  Employee: "/claims",
  Manager: "/review",
  Finance: "/export",
};
