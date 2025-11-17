// components/navigation/main-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/contexts/auth-context";

export function MainNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  // Customer-focused navigation items
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/product", label: "Shop" },
    { href: "/product?category=electronics", label: "Electronics" },
    { href: "/product?category=clothing", label: "Fashion" },
    { href: "/product?category=accessories", label: "Accessories" },
  ];

  return (
    <nav className="flex items-center gap-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`text-sm font-medium transition-colors hover:text-primary ${
            isActive(item.href)
              ? "text-primary border-b-2 border-primary"
              : "text-foreground/60"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}