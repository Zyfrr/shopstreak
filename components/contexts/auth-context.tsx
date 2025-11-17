// components/contexts/auth-context.tsx (COMPLETE FIX)
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  onboardingStatus: string;
  authProvider: string;
  emailVerified: boolean;
  hasPassword?: boolean;
}

interface CustomerProfile {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  dateOfBirth?: string;
  gender?: string;
  addresses?: any[];
}

interface AuthContextType {
  user: User | null;
  customerProfile: CustomerProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string) => Promise<any>;
  loginWithGoogle: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  completeProfile: (profileData: any) => Promise<boolean>;
  isAuthenticated: boolean;
  needsProfileSetup: boolean;
  refreshUser: () => Promise<void>;
  refreshCustomerProfile: () => Promise<void>;
  checkPasswordStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  // Check if this is an admin route immediately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminRoute = window.location.pathname.startsWith('/admin');
      setIsAdminRoute(adminRoute);
      
      if (adminRoute) {
        console.log('🛑 Admin route detected - skipping all auth logic');
        setIsLoading(false);
        return;
      }
    }

    const checkAuth = async () => {
      try {
        await refreshUser();
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Return early for admin routes - no API calls
  if (isAdminRoute) {
    const adminValue: AuthContextType = {
      user: null,
      customerProfile: null,
      isLoading: false,
      login: async () => false,
      signup: async () => ({ success: false }),
      loginWithGoogle: async () => false,
      logout: async () => {},
      completeProfile: async () => false,
      isAuthenticated: false,
      needsProfileSetup: false,
      refreshUser: async () => {},
      refreshCustomerProfile: async () => {},
      checkPasswordStatus: async () => false,
    };

    return <AuthContext.Provider value={adminValue}>{children}</AuthContext.Provider>;
  }

  // Regular auth logic for non-admin routes
  const checkPasswordStatus = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return false;

      const response = await fetch("/api/auth/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.user) {
          const userData = result.data.user;
          return userData.hasPassword || false;
        }
      }
    } catch (error) {
      console.error("Error checking password status:", error);
    }
    
    return false;
  };

  const mapUserData = async (userData: any): Promise<User> => {
    if (!userData) return null;

    const hasPassword = userData.hasPassword || await checkPasswordStatus();

    const mappedUser = {
      id: userData.id || userData._id?.toString(),
      email: userData.email || userData.SS_USER_EMAIL,
      role: userData.role || userData.SS_USER_ROLE,
      firstName: userData.firstName,
      lastName: userData.lastName,
      mobileNumber: userData.mobileNumber,
      onboardingStatus: userData.onboardingStatus || userData.SS_ONBOARDING_STATUS,
      authProvider: userData.authProvider || userData.SS_AUTH_PROVIDER,
      emailVerified: userData.emailVerified || userData.SS_EMAIL_VERIFIED || false,
      hasPassword
    };

    return mappedUser;
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const userData = localStorage.getItem("userData");
      const profileData = localStorage.getItem("customerProfile");

      if (token) {
        try {
          const response = await fetch("/api/auth/user", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const result = await response.json();
            
            if (result.success && result.data.user) {
              const freshUser = await mapUserData(result.data.user);
              
              setUser(freshUser);
              localStorage.setItem("userData", JSON.stringify(freshUser));

              if (profileData) {
                const parsedProfile = JSON.parse(profileData);
                setCustomerProfile(parsedProfile);
              } else {
                await refreshCustomerProfile();
              }
              return;
            }
          }
        } catch (error) {
          console.error("Error fetching fresh user data:", error);
        }
      }

      if (userData) {
        const parsedUser = JSON.parse(userData);
        const hasPassword = await checkPasswordStatus();
        const enhancedUser = { ...parsedUser, hasPassword };
        
        setUser(enhancedUser);

        if (profileData) {
          const parsedProfile = JSON.parse(profileData);
          setCustomerProfile(parsedProfile);
        } else {
          await refreshCustomerProfile();
        }
      } else {
        setUser(null);
        setCustomerProfile(null);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
      setCustomerProfile(null);
    }
  };

  const refreshCustomerProfile = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.profile) {
          const profile = result.data.profile;
          setCustomerProfile(profile);
          localStorage.setItem("customerProfile", JSON.stringify(profile));
        }
      }
    } catch (error) {
      console.error("Error refreshing customer profile:", error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        const { user: userData, tokens, customerProfile: profile } = result.data;
        const mappedUser = await mapUserData(userData);

        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
        localStorage.setItem("userData", JSON.stringify(mappedUser));

        setUser(mappedUser);

        if (profile) {
          localStorage.setItem("customerProfile", JSON.stringify(profile));
          setCustomerProfile(profile);
        } else {
          localStorage.removeItem("customerProfile");
          setCustomerProfile(null);
          await refreshCustomerProfile();
        }

        return true;
      } else {
        console.error("Login failed:", result.message);
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const signup = async (email: string) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      return await response.json();
    } catch (error) {
      console.error("Signup error:", error);
      return { success: false, message: "Network error" };
    }
  };

  const loginWithGoogle = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (result.success) {
        const { user: userData, tokens, customerProfile: profile } = result.data;
        const mappedUser = await mapUserData(userData);

        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
        localStorage.setItem("userData", JSON.stringify(mappedUser));

        setUser(mappedUser);

        if (profile) {
          localStorage.setItem("customerProfile", JSON.stringify(profile));
          setCustomerProfile(profile);
        } else {
          localStorage.removeItem("customerProfile");
          setCustomerProfile(null);
          await refreshCustomerProfile();
        }

        return true;
      } else {
        console.error("Google login failed:", result.message);
        return false;
      }
    } catch (error) {
      console.error("Google login error:", error);
      return false;
    }
  };

  const completeProfile = async (profileData: any): Promise<boolean> => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token");

      const response = await fetch("/api/users/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const result = await response.json();

      if (result.success) {
        const { user: userData, customerProfile: profile } = result.data;
        const mappedUser = await mapUserData(userData);

        localStorage.setItem("userData", JSON.stringify(mappedUser));
        localStorage.setItem("customerProfile", JSON.stringify(profile));

        setUser(mappedUser);
        setCustomerProfile(profile);

        return true;
      }
      return false;
    } catch (error) {
      console.error("Profile completion error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch((error) => {
          console.log("Logout API call failed:", error);
        });
      }
    } catch (error) {
      console.log("Error during logout API call:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
      localStorage.removeItem("customerProfile");

      setUser(null);
      setCustomerProfile(null);
    }
  };

  const value = {
    user,
    customerProfile,
    isLoading,
    login,
    signup,
    loginWithGoogle,
    logout,
    completeProfile,
    isAuthenticated: !!user,
    needsProfileSetup: user?.onboardingStatus === "profile_setup",
    refreshUser,
    refreshCustomerProfile,
    checkPasswordStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}