"use client";

import { AccountNav } from "@/components/navigation/account-nav";

interface AccountLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  showBackButton?: boolean;
  backHref?: string;
}

export function AccountLayout({ 
  children, 
  title, 
  description, 
  showBackButton = false,
  backHref = "/account"
}: AccountLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Desktop Navigation Sidebar */}
        <div className="hidden lg:block lg:w-1/4">
          <AccountNav />
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Mobile Navigation - Only show if not on main account page */}
          {!showBackButton && (
            <div className="lg:hidden mb-6">
              <AccountNav />
            </div>
          )}

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>

          {/* Page Content */}
          {children}
        </div>
      </div>
    </div>
  );
}