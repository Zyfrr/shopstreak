"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/contexts/cart-context";
import {
  HiHome,
  HiShoppingCart,
  HiUser,
  HiClipboardList,
  HiInformationCircle,
} from "react-icons/hi";

export function BottomNav() {
  const { items } = useCart();
  const pathname = usePathname();
  
  if (pathname.startsWith("/admin")) {
    return null;
  }
  
  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  const navItems = [
    { href: "/", icon: HiHome, label: "Home" },
    { href: "/product", icon: HiClipboardList, label: "Products" },
    {
      href: "/checkout/cart",
      icon: HiShoppingCart,
      label: "Cart",
      badge: items.length > 0 ? items.length : undefined,
    },
    { href: "/account/orders", icon: HiUser, label: "Orders" },
    { href: "/info/about", icon: HiInformationCircle, label: "About" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-40">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center gap-1 py-3 px-4 flex-1 text-center transition ${
              isActive(item.href) ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {/* Icon wrapper for precise badge positioning */}
            <div className="relative">
              <item.icon className="w-6 h-6" />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}