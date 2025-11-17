"use client";

import { LogOut, Menu, X, User } from "lucide-react";
import { HiSun } from "react-icons/hi";
import { useAdminAuth } from "@/components/contexts/admin-auth-context";
import { useTheme, type Theme } from "@/components/contexts/theme-provider";

interface AdminHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function AdminHeader({
  sidebarOpen,
  onToggleSidebar,
}: AdminHeaderProps) {
  const { admin, logout } = useAdminAuth();
  const { theme, setTheme } = useTheme();

  const themeOptions: Theme[] = ["sunset", "ocean", "forest"];

  // 🟦 Cycle theme: sunset → ocean → forest → sunset
  const toggleTheme = () => {
    const currentIndex = themeOptions.indexOf(theme);
    const nextTheme = themeOptions[(currentIndex + 1) % themeOptions.length];
    setTheme(nextTheme);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "ocean":
        return <HiSun className="w-5 h-5 text-blue-500" />;
      case "forest":
        return <HiSun className="w-5 h-5 text-green-500" />;
      case "sunset":
      default:
        return <HiSun className="w-5 h-5 text-orange-500" />;
    }
  };

  // 🟧 Accessible label
  const getThemeLabel = () => {
    switch (theme) {
      case "sunset":
        return "Switch to Ocean Theme";
      case "ocean":
        return "Switch to Forest Theme";
      case "forest":
        return "Switch to Sunset Theme";
      default:
        return "Change Theme";
    }
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="p-2 hover:bg-muted rounded-lg transition"
        aria-label="Toggle Sidebar"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <div className="flex items-center gap-4">
        
        {/* Admin Info */}
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium">
            {admin?.email || "Admin User"}
          </p>
          <p className="text-xs text-muted-foreground">Administrator</p>
        </div>

        {/* Theme Switch */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label={getThemeLabel()}
          title={getThemeLabel()}
        >
          {getThemeIcon()}
        </button>

        {/* Avatar */}
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
