// Logs in once per role (Employee/Manager/Finance test users, published on
// the milestone's roles-gate ticket — see tests/validation/test-plan.md) via
// the real Thunder OIDC + PKCE browser flow, then saves each session's
// storageState so specs can start already signed in (UI specs via
// test.use({ storageState })) or read the access_token straight out of it
// (API specs via lib/auth.ts:tokenFor) without repeating the login.
import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { target } from "./lib/targets";
import { storageStatePath, type Role } from "./lib/auth";

const HOSTNAME_PATTERN = /^[A-Za-z0-9.-]+$/;

function resolveIPv4(host: string): string | undefined {
  if (!HOSTNAME_PATTERN.test(host)) return undefined;
  try {
    const first = execSync(`getent ahostsv4 ${host}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).split(/\s+/)[0];
    return first || undefined;
  } catch {
    return undefined;
  }
}

function hostResolverArgs(baseURL: string): string[] {
  const targetHost = new URL(baseURL).hostname;
  if (!targetHost.endsWith(".localhost")) return [];
  const ingressIP = process.env.AEP_E2E_INGRESS_IP ?? resolveIPv4(targetHost);
  const authIP = process.env.AEP_E2E_AUTH_IP ?? resolveIPv4("host.k3d.internal");
  const rules = [
    ingressIP ? `MAP *.openchoreoapis.localhost ${ingressIP}` : "",
    authIP ? `MAP *.openchoreo.localhost ${authIP}` : "",
  ].filter(Boolean);
  return rules.length ? [`--host-resolver-rules=${rules.join(",")}`] : [];
}

interface RoleCred {
  role: Role;
  username: string | undefined;
  password: string | undefined;
}

export default async function globalSetup() {
  const baseURL = target("expense-webapp");
  const browser = await chromium.launch({ args: hostResolverArgs(baseURL) });

  const creds: RoleCred[] = [
    { role: "employee", username: process.env.AEP_E2E_EMPLOYEE_USERNAME, password: process.env.AEP_E2E_EMPLOYEE_PASSWORD },
    { role: "manager", username: process.env.AEP_E2E_MANAGER_USERNAME, password: process.env.AEP_E2E_MANAGER_PASSWORD },
    { role: "finance", username: process.env.AEP_E2E_FINANCE_USERNAME, password: process.env.AEP_E2E_FINANCE_PASSWORD },
  ];

  try {
    for (const cred of creds) {
      if (!cred.username || !cred.password) {
        throw new Error(
          `missing credentials for role "${cred.role}" — set AEP_E2E_${cred.role.toUpperCase()}_USERNAME/PASSWORD`,
        );
      }
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(baseURL);
      await page.getByRole("textbox", { name: "Username" }).fill(cred.username);
      await page.getByRole("textbox", { name: "Password" }).fill(cred.password);
      await page.getByRole("button", { name: "Sign In" }).click();
      await page.waitForURL((url) => url.origin === new URL(baseURL).origin, { timeout: 30_000 });
      // The app's own AuthProvider gates on a resolved role before rendering
      // the shell; wait for the sign-in spinner to clear so the saved
      // storageState reflects a fully-established session, not a mid-flight
      // one whose localStorage entry could still change.
      await page.getByText("Signing in...").waitFor({ state: "detached", timeout: 15_000 }).catch(() => {});
      const outFile = storageStatePath(cred.role);
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      await context.storageState({ path: outFile });
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
