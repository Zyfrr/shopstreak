// app/admin/layout.tsx - FIXED
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/navigation/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";
import { AdminAuthProvider, useAdminAuth } from "@/components/contexts/admin-auth-context";

// Inner component that uses the admin auth context
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, isLoading, isAuthenticated, refreshAdmin } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adminAccessToken');
      const isLoginPage = pathname === '/admin/login';

      console.log('🔐 Admin layout auth check:', { 
        token: !!token, 
        isLoginPage, 
        isAuthenticated,
        pathname 
      });

      // Handle OAuth callback
      if (pathname === '/admin' && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const adminAuth = urlParams.get('admin_auth');
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');

        if (adminAuth === 'success' && accessToken && refreshToken) {
          console.log('🔄 Handling OAuth callback in layout');
          localStorage.setItem('adminAccessToken', accessToken);
          localStorage.setItem('adminRefreshToken', refreshToken);
          
          // Clean URL and refresh admin data
          window.history.replaceState({}, '', '/admin');
          await refreshAdmin();
          return;
        }
      }

      // If no token and not on login page, redirect to login
      if (!token && !isLoginPage) {
        console.log('🚫 No admin token, redirecting to login');
        router.push('/admin/login');
        return;
      }

      // If has token and on login page, check if valid admin
      if (token && isLoginPage) {
        await refreshAdmin();
        if (isAuthenticated) {
          console.log('✅ Has admin token, redirecting to admin');
          router.push('/admin');
          return;
        }
      }

      setAuthChecked(true);
    };

    checkAuth();
  }, [router, pathname, isLoading, isAuthenticated, refreshAdmin]);

  // Show loading state
  if (isLoading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not on login page, show nothing (will redirect)
  if (!isAuthenticated && pathname !== '/admin/login') {
    return null;
  }

  // Only show layout for admin pages, not login
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader 
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// Outer provider component
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  );
}