// components/contexts/admin-auth-context.tsx - FIXED
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  authProvider: string;
  emailVerified: boolean;
  createdAt: string;
}

interface AdminData {
  role: string;
  permissions: any[];
  lastLogin: string;
  activeStatus: boolean;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  adminData: AdminData | null;
  isLoading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
  refreshAdmin: () => Promise<void>; // Changed from Promise<boolean>
  hasPermission: (permission: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Allowed admin emails
const ALLOWED_ADMIN_EMAILS = [
  'shopstreak18@gmail.com',
  'irshadhullab32@gmail.com', 
  'rajprithivi099@gmail.com',
  'team.zyfrr@gmail.com',
  'iam.sharanyv@gmail.com'
];

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAdminEmail = (email: string): boolean => {
    return ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase());
  };

  // FIXED: Return type changed to Promise<void>
  const refreshAdmin = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('adminAccessToken');
      
      if (!token) {
        setAdmin(null);
        setAdminData(null);
        return;
      }

      const response = await fetch('/api/admin/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data.user) {
          const userData = result.data.user;
          const adminInfo = result.data.admin;
          
          // Check if user email is in allowed admin list
          if (!checkAdminEmail(userData.email)) {
            console.warn('Access denied: Email not in admin list', userData.email);
            logout();
            return;
          }

          setAdmin({
            id: userData.id,
            email: userData.email,
            role: userData.role,
            authProvider: userData.authProvider,
            emailVerified: userData.emailVerified,
            createdAt: userData.createdAt,
          });
          
          setAdminData(adminInfo);
        } else {
          // Invalid token or admin access
          console.warn('Invalid admin token or access');
          logout();
        }
      } else {
        // Token invalid or expired
        console.warn('Admin token invalid or expired');
        logout();
      }
    } catch (error) {
      console.error('Error refreshing admin:', error);
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    setAdmin(null);
    setAdminData(null);
    
    // Only redirect if not already on login page
    if (!pathname.includes('/admin/login')) {
      router.push('/admin/login');
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!adminData?.permissions) return false;
    return adminData.permissions.includes(permission);
  };

  // Auto-check authentication on route changes
  useEffect(() => {
    const checkAuth = async () => {
      const isLoginPage = pathname === '/admin/login';
      const token = localStorage.getItem('adminAccessToken');

      if (isLoginPage && token) {
        // If on login page but has token, verify and redirect
        await refreshAdmin();
        if (admin) { // Check if admin is set after refresh
          router.push('/admin');
          return;
        }
      }

      if (!isLoginPage) {
        // For admin pages, verify authentication
        if (!token) {
          router.push('/admin/login');
          return;
        }

        await refreshAdmin();
        // If still not authenticated after refresh, redirect
        if (!admin) {
          router.push('/admin/login');
          return;
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [pathname]);

  const value = {
    admin,
    adminData,
    isLoading,
    logout,
    isAuthenticated: !!admin,
    refreshAdmin,
    hasPermission,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}