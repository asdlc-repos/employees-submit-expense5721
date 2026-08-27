// Reads the access token oidc-client-ts stored in a role's saved
// storageState (written by global-setup.ts) so API-only specs can attach
// `Authorization: Bearer <token>` without driving a browser login.
import fs from "node:fs";
import path from "node:path";

export type Role = "employee" | "manager" | "finance";

interface StorageStateOrigin {
  origin: string;
  localStorage: { name: string; value: string }[];
}

export function storageStatePath(role: Role): string {
  return path.join(__dirname, "..", ".auth", `${role}.json`);
}

export function tokenFor(role: Role): string {
  const file = storageStatePath(role);
  const state: { origins?: StorageStateOrigin[] } = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const origin of state.origins ?? []) {
    const entry = origin.localStorage.find((e) => e.name.includes("oidc.user:"));
    if (entry) {
      const parsed = JSON.parse(entry.value) as { access_token?: string };
      if (parsed.access_token) return parsed.access_token;
    }
  }
  throw new Error(`no oidc access_token found in storage state for role "${role}" (${file})`);
}
