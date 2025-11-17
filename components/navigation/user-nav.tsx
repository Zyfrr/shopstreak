"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  HiChartBar, 
  HiShoppingBag, 
  HiHeart, 
  HiTruck 
} from "react-icons/hi"

const userRoutes = [
  { href: "/account", label: "Overview", icon: HiChartBar },
  { href: "/account/orders", label: "My Orders", icon: HiShoppingBag },
  { href: "/account/wishlist", label: "Wishlist", icon: HiHeart },
  { href: "/account/order-tracking", label: "Track Order", icon: HiTruck },
]

export function UserNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {userRoutes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === route.href 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <route.icon className="w-5 h-5" />
          <span>{route.label}</span>
        </Link>
      ))}
    </nav>
  )
}