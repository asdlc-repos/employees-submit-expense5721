import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AppShell } from "@astryxdesign/core/AppShell";
import { TopNav, TopNavHeading } from "@astryxdesign/core/TopNav";
import { SideNav, SideNavItem, SideNavSection } from "@astryxdesign/core/SideNav";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Icon } from "@astryxdesign/core/Icon";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../roles";

// One nav entry per screen this role may reach (specs/design/roles.json
// permissions[].screens) plus a non-navigable "Settings" placeholder — the
// wireframes' sidebar names it but no `screen Settings` block exists, so it
// is not one of the six screens this app implements.
const NAV_BY_ROLE: Record<Role, { label: string; href: string; icon: "checkDouble" | "clock" | "arrowUp" }[]> = {
  Employee: [{ label: "My Claims", href: "/claims", icon: "checkDouble" }],
  Manager: [{ label: "Review Queue", href: "/review", icon: "clock" }],
  Finance: [{ label: "Export Queue", href: "/export", icon: "arrowUp" }],
};

export function Shell({ children }: { children: ReactNode }) {
  const { role, displayName, signOut } = useAuth();
  const location = useLocation();
  const items = NAV_BY_ROLE[role];

  return (
    <AppShell
      contentPadding={4}
      topNav={
        <TopNav
          heading={<TopNavHeading heading="Expense Claims" />}
          endContent={
            <DropdownMenu
              button={{ label: displayName, variant: "ghost", icon: <Icon icon="moreHorizontal" /> }}
              items={[{ label: "Sign out", onClick: () => void signOut() }]}
            />
          }
        />
      }
      sideNav={
        <SideNav>
          <SideNavSection title={role}>
            {items.map((item) => (
              <SideNavItem
                key={item.href}
                label={item.label}
                href={item.href}
                icon={item.icon}
                isSelected={location.pathname.startsWith(item.href)}
              />
            ))}
            <SideNavItem label="Settings" isDisabled icon="wrench" />
          </SideNavSection>
        </SideNav>
      }
    >
      {children}
    </AppShell>
  );
}
