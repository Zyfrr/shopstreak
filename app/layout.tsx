import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { RootProvider } from "@/components/providers/root-provider";
import { CartProvider } from "@/components/contexts/cart-context"
import { ThemeProvider } from "@/components/contexts/theme-provider"
import { ToastProvider } from "@/components/providers/toast-provider"
import { ToastContainer } from "@/components/layout/toast-container"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BottomNav } from "@/components/layout/bottom-nav"
import { ProfileSetupRedirect } from "@/components/layout/profile-setup-redirect"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ShopStreak - Under 6000 Dropshipping Platform",
  description: "Fast, reliable dropshipping e-commerce platform",
}

// Client component to handle conditional rendering
function ClientLayout({ children }: { children: React.ReactNode }) {
  // This runs only on client side
  if (typeof window !== 'undefined') {
    const isAdminRoute = window.location.pathname.startsWith('/admin')
    
    if (isAdminRoute) {
      // For admin routes, don't use AuthProvider and don't show header/footer
      return (
        <ThemeProvider defaultTheme="sunset" storageKey="shopstreak-theme">
          <CartProvider>
            {children}
            <Analytics />
          </CartProvider>
        </ThemeProvider>
      )
    }
  }

  // For non-admin routes, use the full layout with AuthProvider
  return (
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
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.className} suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}