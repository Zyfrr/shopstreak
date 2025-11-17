// components/layout/account-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Package, Truck, ChevronRight } from "lucide-react";
import { useAuth } from "@/components/contexts/auth-context";

interface AccountNavProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

export function AccountNav({ activeTab, onTabChange }: AccountNavProps) {
  const pathname = usePathname();
  const { user, customerProfile } = useAuth();

  // ✅ Separate navigation groups
  const profileNav: NavItem = {
    id: "profile",
    label: "My Profile",
    icon: User,
    href: "/account",
  };

  const shoppingNav: NavItem[] = [
    { id: "orders", label: "My Orders", icon: Package, href: "/account/orders" },
    { id: "order-tracking", label: "Order Tracking", icon: Truck, href: "/account/order-tracking" },
  ];

  // Function to check if a page is active
  const isPageActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // Get user display information
  const displayName = customerProfile 
    ? `${customerProfile.firstName} ${customerProfile.lastName}`
    : user?.email || "User";

  const userEmail = user?.email || "";
  const joinDate = user ? new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Recently";

  return (
    <div className="w-full">
      {/* ✅ Desktop Sidebar */}
      <aside className="hidden lg:block w-full">
        {/* Profile Card */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-center mb-1 truncate">{displayName}</h2>
          <p className="text-sm text-muted-foreground text-center truncate">{userEmail}</p>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Member since {joinDate}
          </p>
        </div>

        {/* ✅ My Profile (Top Section) */}
        <nav className="space-y-2">
          <Link
            href={profileNav.href}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              isPageActive(profileNav.href)
                ? "bg-primary text-primary-foreground font-medium"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <profileNav.icon className="w-5 h-5" />
            <span>{profileNav.label}</span>
            <ChevronRight className="w-4 h-4 ml-auto" />
          </Link>

          {/* Space before Shopping */}
          <div className="mt-6" />

          {/* Shopping Section */}
          <h3 className="text-sm font-semibold text-muted-foreground px-4 mb-2">
            Shopping
          </h3>

          {shoppingNav.map((item) => {
            const Icon = item.icon;
            const isActive = isPageActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 🚫 Mobile Navigation Hidden */}
      <div className="lg:hidden hidden"></div>
    </div>
  );
}