// components/layout/profile-setup-redirect.tsx
"use client";

import { useAuth } from "@/components/contexts/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ProfileSetupRedirect({ children }: { children: React.ReactNode }) {
  const { user, isLoading, refreshUser } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      // Check if user needs profile setup
      const needsProfileSetup = 
        user.onboardingStatus === "profile_setup" ||
        user.onboardingStatus === "pending" ||
        !user.firstName || 
        !user.lastName;

      // Don't redirect from these pages
      const publicPaths = [
        '/auth/', 
        '/info/', 
        '/product', 
        '/', 
        '/api/',
        '/checkout/cart'
      ];
      
      const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
      const isProfileSetupPage = pathname === "/auth/profile-setup";
      
      if (needsProfileSetup && !isPublicPath && !isProfileSetupPage) {
        setShouldRedirect(true);
        router.push("/auth/profile-setup");
      } else {
        setShouldRedirect(false);
      }
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading || shouldRedirect) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}