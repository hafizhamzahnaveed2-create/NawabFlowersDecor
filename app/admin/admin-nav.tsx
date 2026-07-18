"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { PermissionKey } from "@/lib/permissions";
import { hasAllPermissions, hasAnyPermission } from "@/lib/permission-checks";

type NavPermission =
  | { type: "any"; keys: PermissionKey[] }
  | { type: "all"; keys: PermissionKey[] };

type NavItem = {
  href: string;
  label: string;
  match?: "exact";
  access: NavPermission;
};

type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        match: "exact",
        access: {
          type: "any",
          keys: ["orders.read", "catalog.read", "analytics.read"],
        },
      },
      {
        href: "/admin/analytics",
        label: "Analytics",
        access: { type: "all", keys: ["analytics.read"] },
      },
      {
        href: "/admin/activity",
        label: "Activity",
        access: { type: "all", keys: ["activity.read"] },
      },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        href: "/admin/products",
        label: "Products",
        access: { type: "all", keys: ["catalog.read"] },
      },
      {
        href: "/admin/categories",
        label: "Categories",
        access: { type: "all", keys: ["catalog.write"] },
      },
      {
        href: "/admin/builder",
        label: "Bouquet builder",
        access: { type: "any", keys: ["builder.write", "catalog.read"] },
      },
      {
        href: "/admin/reviews",
        label: "Reviews",
        access: { type: "all", keys: ["reviews.moderate"] },
      },
    ],
  },
  {
    label: "Orders",
    items: [
      {
        href: "/admin/orders",
        label: "Orders",
        access: { type: "all", keys: ["orders.read"] },
      },
      {
        href: "/admin/coupons",
        label: "Coupons",
        access: { type: "all", keys: ["coupons.write"] },
      },
      {
        href: "/admin/payment-methods",
        label: "Payment methods",
        access: { type: "all", keys: ["payments.write"] },
      },
    ],
  },
  {
    label: "Shop",
    items: [
      {
        href: "/admin/content",
        label: "Website content",
        access: { type: "all", keys: ["content.write"] },
      },
      {
        href: "/admin/shipping",
        label: "Delivery & tax",
        access: { type: "all", keys: ["settings.write"] },
      },
      {
        href: "/admin/settings",
        label: "Shop settings",
        access: { type: "all", keys: ["settings.write"] },
      },
      {
        href: "/admin/staff",
        label: "Staff",
        access: { type: "all", keys: ["staff.manage"] },
      },
    ],
  },
];

function canSee(permissions: string[] | undefined, access: NavPermission): boolean {
  if (!permissions?.length) return false;
  if (access.type === "any") return hasAnyPermission(permissions, access.keys);
  return hasAllPermissions(permissions, access.keys);
}

export function AdminNav({
  permissions: permissionsProp,
  onNavigate,
}: {
  permissions?: string[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const permissions = permissionsProp ?? session?.user?.permissions ?? [];

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canSee(permissions, item.access)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <nav className="flex-1 px-3 pb-4" aria-label="Admin">
      <div className="space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-blush/80">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.match === "exact"
                    ? pathname === item.href
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`block rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-ivory text-burgundy shadow-sm"
                          : "text-ivory/85 hover:bg-burgundy-deep hover:text-ivory"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
