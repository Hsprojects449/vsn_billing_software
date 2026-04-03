"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { LoadingOverlay } from "@/components/loading-overlay"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        // Check if user is banned/deactivated
        if (error.message.toLowerCase().includes("user is banned") || 
            error.message.toLowerCase().includes("email not confirmed")) {
          throw new Error("Your account has been deactivated. Contact your administrator.")
        }
        throw error
      }
      
      // Get user profile to determine redirect based on role and active state
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_active")
        .single()

      // If user is deactivated, immediately sign out and block access
      if (profile && profile.is_active === false) {
        await supabase.auth.signOut()
        throw new Error("Your account has been deactivated. Contact your administrator.")
      }
      
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      })
      
      // Redirect based on role - spinner will stay visible during navigation
      if (profile?.role === "accountant") {
        router.push("/dashboard/clients")
      } else {
        // Super Admin and Admin go to dashboard
        router.push("/dashboard")
      }
      // Note: setIsLoading(false) is intentionally not called here
      // The spinner will remain visible until the page fully loads
    } catch (error: unknown) {
      setIsLoading(false)
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
      })
    }
  }

  return (
    <div className="flex min-h-svh w-full">
      {isLoading && <LoadingOverlay />}

      {/* ── Left branding panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 p-12 text-white">
        {/* Top: logo + name */}
        <div className="flex items-center gap-3">
          <Image
            src="/VSN_Groups_LOGO-removebg-preview.png"
            alt="VSN BillPro"
            width={120}
            height={120}
            className="h-10 w-10 object-contain brightness-0 invert"
            quality={100}
            priority
          />
          <span className="text-xl font-bold tracking-tight">
            VSN <span className="text-blue-300">BillPro</span>
          </span>
        </div>

        {/* Middle: tagline + features */}
        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold leading-tight text-balance">
              Manage billing with<br />
              <span className="text-blue-400">confidence &amp; clarity</span>
            </h2>
            <p className="mt-4 text-blue-100/70 leading-relaxed text-lg">
              GST-compliant invoicing, quotations, payments, and reporting — purpose-built for Indian businesses.
            </p>
          </div>
          <ul className="space-y-4">
            {[
              "GST-ready invoices with IGST / CGST / SGST",
              "Convert quotations to invoices in one click",
              "Real-time payment tracking in ₹",
              "Role-based access for your entire team",
              "Export reports to CSV & PDF anytime",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-blue-100/80 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/25 text-blue-300">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: footer note */}
        <p className="text-xs text-blue-400/60">
          © {new Date().getFullYear()} VSN Groups. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-6 md:p-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile-only logo header */}
          <div className="flex flex-col items-center gap-3 lg:hidden">
            <Image
              src="/VSN_Groups_LOGO-removebg-preview.png"
              alt="VSN BillPro"
              width={192}
              height={192}
              className="h-16 w-16 object-contain"
              quality={100}
              priority
            />
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                VSN <span className="text-blue-600">BillPro</span>
              </h1>
              <p className="mt-1 text-sm text-slate-500">Professional billing management</p>
            </div>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
              <p className="mt-1 text-sm text-slate-500">Sign in to your VSN BillPro account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-11 pr-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              Don&apos;t have an account?{" "}
              <Link href="#" className="font-medium text-blue-600 hover:underline">
                Contact your administrator
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
