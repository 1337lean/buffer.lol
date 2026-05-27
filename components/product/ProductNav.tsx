"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/app", label: "Overview", exact: true },
  { href: "/app/probes", label: "Probes" },
  { href: "/app/probes/new", label: "New probe", exact: true },
  { href: "/app/settings/team", label: "Team", exact: true },
  { href: "/app/settings/team/invites", label: "Invites", exact: true }
];

export function ProductNav() {
  const pathname = usePathname();

  return (
    <nav className="nav-links" aria-label="Workspace navigation">
      {items.map((item) => {
        const active = item.href === "/app/probes"
          ? pathname.startsWith(item.href) && pathname !== "/app/probes/new"
          : item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
