import { forwardRef, type AnchorHTMLAttributes } from "react";
import { Link as RouterLink } from "react-router-dom";

// Astryx's LinkComponentType: must accept href, className, style, children.
// Routes every Astryx nav element (SideNavItem, TopNavItem, Link, Tab, ...)
// through react-router so in-app navigation stays client-side.
interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
}

export const RouterLinkAdapter = forwardRef<HTMLAnchorElement, Props>(function RouterLinkAdapter(
  { href, ...rest },
  ref,
) {
  return <RouterLink ref={ref} to={href ?? "#"} {...rest} />;
});
