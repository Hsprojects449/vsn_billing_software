import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { UserForm } from "@/components/user-form"

export default async function NewUserPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "super_admin") {
    redirect("/dashboard")
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create New User</h1>
        <p className="text-muted-foreground mt-1">Add a new user (Super Admin, Admin, Billing Executive or Accountant)</p>
      </div>

      <div className="max-w-2xl">
        <UserForm organizations={[]} />
      </div>
    </div>
  )
}
