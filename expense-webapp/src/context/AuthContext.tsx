import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "oidc-client-ts";
import { currentUser, signIn, signOut } from "../auth";
import { resolveRole, type Role } from "../roles";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";

interface AuthState {
  user: User;
  role: Role;
  displayName: string;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await currentUser();
      if (cancelled) return;
      if (!user) {
        setChecked(true);
        await signIn();
        return;
      }
      const groups = Array.isArray(user.profile?.groups) ? (user.profile.groups as string[]) : [];
      setState({
        user,
        role: resolveRole(groups),
        displayName: (user.profile?.name as string) || (user.profile?.preferred_username as string) || "Signed in",
        signOut,
      });
      setChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!checked || !state) {
    return (
      <Center height="100vh">
        <Spinner size="lg" label="Signing in..." />
      </Center>
    );
  }

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be used inside <AuthProvider>");
  return ctx;
}
