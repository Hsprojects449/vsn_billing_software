import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VSN BillPro - Billing Management System",
  description: "Professional GST-compliant billing and invoice management system for Indian businesses by VSN Groups",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/VSN_Groups_LOGO-removebg-preview.png",
        rel: "icon",
        type: "image/png",
      },
    ],
    shortcut: "/VSN_Groups_LOGO-removebg-preview.png",
    apple: "/VSN_Groups_LOGO-removebg-preview.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`font-sans antialiased h-full`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
