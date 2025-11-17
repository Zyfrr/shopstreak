"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/shared/logo"
import {
  HiChartBar,
  HiCube,
  HiShoppingCart,
  HiUsers,
  HiTrendingUp,
  HiTruck,
  HiCog
} from "react-icons/hi"

interface AdminSidebarProps {
  isOpen: boolean
}

export function AdminSidebar({ isOpen }: AdminSidebarProps) {
  const pathname = usePathname()

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: HiChartBar },
    { name: "Products", href: "/admin/products", icon: HiCube },
    { name: "Orders", href: "/admin/orders", icon: HiShoppingCart },
    { name: "Customers", href: "/admin/customers", icon: HiUsers },
    { name: "Analytics", href: "/admin/analytics", icon: HiTrendingUp },
    { name: "Suppliers", href: "/admin/suppliers", icon: HiTruck },
    { name: "Settings", href: "/admin/settings", icon: HiCog },
  ]

  return (
    <aside
      className={`${
        isOpen ? "w-64" : "w-20"
      } bg-card border-r border-border transition-all duration-300 flex flex-col overflow-y-auto`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link href="/admin" className="flex items-center gap-3">
          <Logo size="lg" showText={false} />
          {isOpen && (
            <span className="font-bold text-m">ShopStreak Admin</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === item.href 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" />
            {isOpen && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  )
}