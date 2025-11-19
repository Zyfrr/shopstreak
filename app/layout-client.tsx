"use client";

import { useState, useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/contexts/theme-provider"
import { ToastProvider } from "@/components/providers/toast-provider"
import { RootProvider } from "@/components/providers/root-provider"
import { CartProvider } from "@/components/contexts/cart-context"
import { ToastContainer } from "@/components/layout/toast-container"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BottomNav } from "@/components/layout/bottom-nav"
import { ProfileSetupRedirect } from "@/components/layout/profile-setup-redirect"
import { Analytics } from "@vercel/analytics/next"

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
      },
    },
  }))

  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check if current route is admin
    const pathname = window.location.pathname
    setIsAdmin(pathname.startsWith('/admin'))
  }, [])

  if (isAdmin) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="sunset" storageKey="shopstreak-theme">
          <CartProvider>
            {children}
            <Analytics />
          </CartProvider>
        </ThemeProvider>
      </QueryClientProvider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="sunset" storageKey="shopstreak-theme">
        <ToastProvider>
          <RootProvider>
            <CartProvider>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 pb-16 md:pb-0">
                  <ProfileSetupRedirect>
                    {children}
                  </ProfileSetupRedirect>
                </main>
                <ToastContainer />
                <Footer />
                <BottomNav />
              </div>
              <Analytics />
            </CartProvider>
          </RootProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}