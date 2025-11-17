"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/shared/logo";

export function Footer() {
  const pathname = usePathname();
  const [showFooter, setShowFooter] = useState(false);
  
  useEffect(() => {
    const isLargeScreen = window.innerWidth >= 1024;

    if (isLargeScreen) {
      setShowFooter(true);
      return;
    }

    // Mobile: Show ONLY on /account (not nested pages)
    const shouldShow = pathname === "/account";

    setShowFooter(shouldShow);
  }, [pathname]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  if (!showFooter) return null;

  return (
    <footer className="bg-card border-t border-border px-4 py-6 md:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <Logo size="sm" href="/" showText={true} className="mb-2" />
            <p className="text-xs text-muted-foreground max-w-xs">
              Your one-stop destination for quality and style.
            </p>
          </div>

          {/* Contact Info (Desktop) */}
          <div className="hidden sm:flex flex-col text-xs text-muted-foreground items-end">
            <a
              href="mailto:shopstreak18@gmail.com"
              className="hover:text-primary transition"
            >
              📧 shopstreak18@gmail.com
            </a>
            <a href="tel:+919791509443" className="hover:text-primary transition">
              📞 +91 9791509443
            </a>
          </div>
        </div>

        {/* Main Links */}
        <div className="grid grid-cols-4 md:grid-cols-4 gap-6 mb-6">
          {/* Shop */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Shop</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                <Link href="/product" className="hover:text-primary transition">
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/product?category=electronics"
                  className="hover:text-primary transition"
                >
                  Electronics
                </Link>
              </li>
              <li>
                <Link
                  href="/product?category=clothing"
                  className="hover:text-primary transition"
                >
                  Clothing
                </Link>
              </li>
              <li>
                <Link
                  href="/product?category=accessories"
                  className="hover:text-primary transition"
                >
                  Accessories
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Support</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                <Link
                  href="/info/support"
                  className="hover:text-primary transition"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/info/contact"
                  className="hover:text-primary transition"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  className="hover:text-primary transition"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Company</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                <Link href="/info/about" className="hover:text-primary transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/info/support?tab=careers"
                  className="hover:text-primary transition"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/info/contact?tab=press"
                  className="hover:text-primary transition"
                >
                  Press
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Legal</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                <Link
                  href="/info/legal/privacy"
                  className="hover:text-primary transition"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/info/legal/terms"
                  className="hover:text-primary transition"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  href="/info/legal/policies"
                  className="hover:text-primary transition"
                >
                  Policies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Info (Mobile) */}
        <div className="sm:hidden mb-4 text-center text-xs text-muted-foreground space-y-1">
          <a
            href="mailto:shopstreak18@gmail.com"
            className="block hover:text-primary transition"
          >
            📧 shopstreak18@gmail.com
          </a>
          <a href="tel:+919791509443" className="block hover:text-primary transition">
            📞 +91 9791509443
          </a>
        </div>

        <Separator className="mb-4" />
        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} <span className="font-medium">ShopStreak</span>. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
