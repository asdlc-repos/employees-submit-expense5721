import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LinkProvider } from "@astryxdesign/core/Link";
import { RouterLinkAdapter } from "./RouterLinkAdapter";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ROLE_HOME, type Role } from "./roles";
import Callback from "./pages/Callback";
import MyClaims from "./pages/MyClaims";
import ClaimForm from "./pages/ClaimForm";
import ClaimDetail from "./pages/ClaimDetail";
import ReviewQueue from "./pages/ReviewQueue";
import ClaimReviewDetail from "./pages/ClaimReviewDetail";
import ExportQueue from "./pages/ExportQueue";

// Route guard: an Employee must never reach Manager/Finance screens and vice
// versa (specs/design/security.md, roles.json). Nav links are already
// role-scoped in Shell.tsx; this is the second, independent gate that holds
// even for a typed-in URL.
function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { role: current } = useAuth();
  if (current !== role) return <Navigate to={ROLE_HOME[current]} replace />;
  return <>{children}</>;
}

function AuthedApp() {
  const { role } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROLE_HOME[role]} replace />} />

      <Route
        path="/claims"
        element={
          <RequireRole role="Employee">
            <MyClaims />
          </RequireRole>
        }
      />
      <Route
        path="/claims/new"
        element={
          <RequireRole role="Employee">
            <ClaimForm />
          </RequireRole>
        }
      />
      <Route
        path="/claims/:id"
        element={
          <RequireRole role="Employee">
            <ClaimDetail />
          </RequireRole>
        }
      />
      <Route
        path="/claims/:id/edit"
        element={
          <RequireRole role="Employee">
            <ClaimForm />
          </RequireRole>
        }
      />

      <Route
        path="/review"
        element={
          <RequireRole role="Manager">
            <ReviewQueue />
          </RequireRole>
        }
      />
      <Route
        path="/review/:id"
        element={
          <RequireRole role="Manager">
            <ClaimReviewDetail />
          </RequireRole>
        }
      />

      <Route
        path="/export"
        element={
          <RequireRole role="Finance">
            <ExportQueue />
          </RequireRole>
        }
      />

      <Route path="*" element={<Navigate to={ROLE_HOME[role]} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LinkProvider component={RouterLinkAdapter}>
        <Routes>
          {/* /callback completes sign-in itself — it must render outside
              AuthProvider, which would otherwise see "no user yet" and
              restart signinRedirect() before the callback can be handled. */}
          <Route path="/callback" element={<Callback />} />
          <Route
            path="/*"
            element={
              <AuthProvider>
                <AuthedApp />
              </AuthProvider>
            }
          />
        </Routes>
      </LinkProvider>
    </BrowserRouter>
  );
}
