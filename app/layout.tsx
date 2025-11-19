import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { LayoutClient } from "./layout-client"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ShopStreak - Under 6000 Dropshipping Platform",
  description: "Fast, reliable dropshipping e-commerce platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.className} suppressHydrationWarning>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  )
}