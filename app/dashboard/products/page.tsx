import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ProductsTable } from "@/components/products-table"
import { DashboardPageWrapper } from "@/components/dashboard-page-wrapper"
import { Suspense } from "react"
import { LoadingOverlay } from "@/components/loading-overlay"
import { redirect } from "next/navigation"

async function ProductsContent({ userRole, organizationId }: { userRole: string; organizationId: string }) {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from("products")
    .select("*, operators(name), profiles!products_created_by_fkey(full_name)")
    .eq("organization_id", organizationId)
    .order("position", { ascending: true })

  return <ProductsTable products={products || []} userRole={userRole} />
}

export default async function ProductsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .maybeSingle()

  const userRole = profile?.role || "accountant"
  const organizationId = profile?.organization_id

  if (!organizationId) {
    redirect("/dashboard")
  }

  if (userRole === "accountant") {
    redirect("/dashboard/gst-filings")
  }

  return (
    <DashboardPageWrapper title="Products & Services">
      <div className="w-full p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
          {userRole !== "billing_executive" && (
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/products/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Link>
            </Button>
          )}
        </div>

        <Suspense fallback={<LoadingOverlay />}>
          <ProductsContent userRole={userRole} organizationId={organizationId} />
        </Suspense>
      </div>
    </DashboardPageWrapper>
  )
}
