// app/not-found.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Search, ShoppingBag, RefreshCw } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [pathname, setPathname] = useState("");

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    setPathname(window.location.pathname);
  }, []);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-accent/5">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo size={isMobile ? "md" : "lg"} showText={true} />
        </div>

        {/* Error Content */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
          
          <div className="space-y-3">
            <p className="text-muted-foreground text-lg">
              Oops! The page you're looking for doesn't exist.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="flex items-center gap-2 h-12 px-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          
          <Button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 h-12 px-6 bg-primary text-primary-foreground"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
        </div>

        {/* Quick Links */}
        <div className="pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">Quick Links</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/product"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Shop Products
            </Link>
            <Link
              href="/info/support"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              Get Help
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}